import argparse
import json
import random
import os
from os import path

BOARD_SIZE = 16
BOARD_LAYERS = 1
DECK_HISTO = 10
DECK_ONEHOT_LENGTH = 20

EPOCHS = 500

# Amount of samples to load from samples dir
N = 10000

MODEL_DIR = '../numberzero.model'
SAMPLES = '../samples'

input_size = BOARD_SIZE * BOARD_SIZE + DECK_HISTO


def main():
  parser = argparse.ArgumentParser(description='Train NumberZero based on collected samples')
  subparsers = parser.add_subparsers(dest='cmd')
  subparsers.required = True

  train_parser = subparsers.add_parser('train', help='Train on the samples')
  train_parser.set_defaults(func=train)

  train_parser = subparsers.add_parser('reinit', help='Reinitialize network with new architecture')
  train_parser.set_defaults(func=reinit)

  args = parser.parse_args()
  args.func(args)


def reinit(args):
  train_weights(fresh_model())


def train(args):
  train_weights(load_model())


def train_weights(model):
  import tensorflow as tf
  import tensorflowjs as tfjs
  from tensorflow import keras

  tboard = keras.callbacks.TensorBoard(
    log_dir='./TensorBoard',
    histogram_freq=0,
    write_graph=True,
    write_images=True)

  boards, decks, scores = load_all_samples(SAMPLES)
  if boards:
    board_input = tf.convert_to_tensor(boards, dtype=tf.float32)
    deck_input = tf.convert_to_tensor(decks, dtype=tf.float32)
    scores = tf.convert_to_tensor(scores, dtype=tf.float32)
    model.fit(
        { 'board_input': board_input, 'deck_input': deck_input },
        scores,
        epochs=EPOCHS, callbacks=[tboard], validation_split=0.2, shuffle=True)

    # Evaluate on some non-zero outputs
    # mask = [label > 0 for label in scores]
    # int_samples = tf.boolean_mask(data, mask)
    # int_labels = tf.boolean_mask(scores, mask)
    # print(list(zip(model.predict(int_samples), int_labels)))

  tfjs.converters.save_keras_model(model, MODEL_DIR)
  model.save(MODEL_DIR + '/keras.h5') # Two copies so we can read the original back


def fresh_model():
  from tensorflow.keras import Sequential
  from tensorflow.keras.layers import Dense
  from tensorflow.keras import optimizers
  from tensorflow.keras.layers import Input, Dense, Conv2D, concatenate, MaxPool2D, Flatten, Dropout, BatchNormalization
  from tensorflow.keras.models import Model
  from tensorflow.keras.constraints import max_norm
  from tensorflow.keras.utils import plot_model

  # This is going to be a multi-input model
  # One input for the board layers, one input for the remaining tile vectors
  # Convoluational layer over the board, then combine with the tiles.
  board_input = Input(shape=(BOARD_SIZE, BOARD_SIZE, BOARD_LAYERS), dtype='float32', name='board_input')
  deck_input = Input(shape=(DECK_ONEHOT_LENGTH,), dtype='float32', name='deck_input')

  krnargs = dict(kernel_initializer='normal', kernel_constraint=max_norm(5))

  filters = 512

  convolved_board = Conv2D(filters, kernel_size=5, padding='same', use_bias=False, input_shape=(BOARD_SIZE, BOARD_SIZE, BOARD_LAYERS))(board_input)
  convolved_board = BatchNormalization(axis=3)(convolved_board)
  convolved_board = Conv2D(filters, kernel_size=5, padding='valid', use_bias=False)(convolved_board)
  convolved_board = BatchNormalization(axis=3)(convolved_board)
  print(convolved_board)
  # 1x1x64
  convolved_board = Flatten()(convolved_board)
  # 64

  x = concatenate([convolved_board, deck_input])

  # We stack a deep densely-connected network on top
  x = Dropout(0.5)(x)
  x = Dense(128, activation='relu', **krnargs)(x)
  x = Dropout(0.5)(x)
  x = Dense(64, activation='relu', **krnargs)(x)
  x = Dropout(0.5)(x)
  score_output = Dense(1, activation='relu', name='score_output', kernel_initializer='normal')(x)

  model = Model(inputs=[board_input, deck_input], outputs=[score_output])

  # Training parameters
  sgd = optimizers.SGD(lr=0.0005, decay=0.0)
  model.compile(optimizer='adam',
                loss='mse',
                metrics=['accuracy'])

  plot_model(model, to_file='model.png')

  return model


def load_model():
  from tensorflow import keras
  from keras.models import load_model

  return keras.models.load_model(MODEL_DIR + '/keras.h5')


def load_all_samples(dir):
  print('Loading samples')

  samples = []
  if path.isdir(dir):
    files = [f for f in os.listdir(dir) if f.endswith('.json')]
    # Sort by name (which is a timestamp, so oldest first)
    files.sort(key=lambda f:int(path.splitext(f)[0]))
    files.reverse()

    for fname in files:
      with open(path.join(dir, fname)) as f:
        data = json.load(f)

      if data['board_size'] != BOARD_SIZE:
        print('Board size incorrect in %s (%d != %d)' % (fname, data['board_size'], BOARD_SIZE))
        continue

      version = data.get('version', 0)
      if version == 0:
        # Load old data, upconvert to new board format
        for situation, score in data['samples']:
          new_format = upgrade_format(situation)
          # print_situation(situation)
          samples.append(dict(
            board=new_format['board'],
            deck=new_format['deck'],
            score=score))
      else:
        raise RuntimeError('Cant load version %s yet' % version)

      if len(samples) >= N:
        break

  print('Using %d samples' % len(samples))
  random.shuffle(samples)

  boards = []
  decks = []
  scores = []

  for sample in samples:
    boards.append(sample['board'])
    decks.append(sample['deck'])
    scores.append(sample['score'])

  return boards, decks, scores


def print_situation(sit):
  height_map = sit[:-10]
  print('\n'.join(
    ''.join(
      str(cell) for cell in row
    ) for row in grouper(height_map, BOARD_SIZE)))
  print(sit[-10:])


def upgrade_format(elements):
  """Convert old to new sample format.

  Old sample format: [BOARD_SIZE * BOARD_SIE heightmap, 10 card histogram]
  New sample format: board = [[[x] * BOARD_LAYERS] BOARD_SIZE] * BOARD_SIZE], deck = [20 card one-hot vectors]
  """
  height_map = elements[:BOARD_SIZE * BOARD_SIZE]
  card_histo = elements[BOARD_SIZE * BOARD_SIZE:]
  assert len(card_histo) == 10  # Otherwise oops

  # Turn deck into layers
  rows = list(grouper(height_map, BOARD_SIZE))
  board = (
    [
      [
        [1 if cell >= h + 1 else 0 for h in range(BOARD_LAYERS)]
      for cell in row]
    for row in rows])

  # Convert deck vector
  card_onehot = [0] * 20
  for i, count in enumerate(card_histo):
    if count > 0:
      card_onehot[i * 2] = 1
    if count > 1:
      card_onehot[i * 2 + 1] = 1

  return { 'board': board, 'deck': card_onehot }


def grouper(iterable, n, fillvalue=None):
    "Collect data into fixed-length chunks or blocks"
    import itertools
    # grouper('ABCDEFG', 3, 'x') --> ABC DEF Gxx"
    args = [iter(iterable)] * n
    return itertools.zip_longest(*args, fillvalue=fillvalue)


if __name__ == '__main__':
  main()
