import argparse
import json
import os
from os import path

BOARD_SIZE = 16
DECK_HISTO = 10

EPOCHS = 50

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

  data, scores = load_all_samples(SAMPLES)
  if data:
    data = tf.convert_to_tensor(data, dtype=tf.float32)
    scores = tf.convert_to_tensor(scores, dtype=tf.float32)
    model.fit(data, scores, epochs=EPOCHS, callbacks=[tboard])

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

  sgd = optimizers.SGD(lr=0.005, decay=0.0)

  model = Sequential()
  model.add(Dense(200, activation='relu', input_shape=(input_size,)))
  model.add(Dense(50, activation='relu'))
  model.add(Dense(1, activation='relu'))
  model.compile(optimizer=sgd,
                loss='mse',
                metrics=['accuracy'])

  return model


def load_model():
  from tensorflow import keras
  from keras.models import load_model

  return keras.models.load_model(MODEL_DIR + '/keras.h5')


def load_all_samples(dir):
  situations = []
  scores = {}

  if path.isdir(dir):
    files = [f for f in os.listdir(dir) if f.endswith('.json')]
    # Sort by name (which is a timestamp, so oldest first)
    files.sort(key=lambda f:int(path.splitext(f)[0]))

    for fname in files:
      with open(path.join(dir, fname)) as f:
        data = json.load(f)

      if data['board_size'] != BOARD_SIZE:
        print('Board size incorrect in %s (%d != %d)' % (fname, data['board_size'], BOARD_SIZE))
        continue

      version = data.get('version', 1)

      for situation, score in data['samples']:
        situation = tuple(situation)
        if situation in scores:
          # Overwrite existing scenarios but maintain the 'max' function
          score = max(score, scores[situation])
        scores[situation] = score
        situations.append(situation)

  # Take the most recent 10k situations (so old measurements have a chance to
  # age out).

  train = []
  predict = []
  for situation in situations[-10000:]:
    train.append(list(situation))
    predict.append(scores[situation])

  print('Using %d out of %d samples' % (len(train), len(situations)))

  return train, predict


def upgrade


if __name__ == '__main__':
  main()
