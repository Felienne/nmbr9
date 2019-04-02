#!/bin/bash
# Must be done before set -u
echo Activating venv
source venv/bin/activate

set -euo pipefail
echo Compiling
(cd .. && node_modules/.bin/tsc)

while true; do
  echo Training
  python zero-trainer.py train

  echo Playing
  (cd .. && date >> games.txt && node zero-trainer --model numberzero.model --samples samples | tee -a games.txt)
done
