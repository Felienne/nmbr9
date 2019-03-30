import json
import os
from os import path

import tensorflow as tf
import tensorflowjs as tfjs
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Dense

BOARD_SIZE = 16
DECK_HISTO = 10

MODEL_DIR = '../numberzero.model'
SAMPLES = '../samples'


def main():
  input_size = BOARD_SIZE * BOARD_SIZE + DECK_HISTO

  model = Sequential()
  model.add(Dense(200, activation='relu', input_dim=input_size))
  model.add(Dense(1, activation='sigmoid'))
  model.compile(optimizer='rmsprop',
                loss='binary_crossentropy',
                metrics=['accuracy'])

  data, labels = load_all_samples(SAMPLES)
  if data:
    model.fit(data, labels, epochs=10, steps_per_epoch=32)

  tfjs.converters.save_keras_model(model, MODEL_DIR)


def load_all_samples(dir):
  train = []
  predict = []

  if path.isdir(dir):
    for fname in os.listdir(dir):
      if not fname.ends_with('.json'): continue

      with open(path.join(dir, fname)) as f:
        data = json.load(f)

      if data['board_size'] != BOARD_SIZE:
        print('Board size incorrect in %s (%d != %d)' % (fname, data['board_size'], BOARD_SIZE))
        continue

      train.extend(s[0] for s in data['samples'])
      predict.extend(s[1] for s in data['samples'])

  return train, predict


if __name__ == '__main__':
  main()
