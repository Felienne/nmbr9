#!/bin/bash
set -euo pipefail
(cd .. && tsc)

python zero-trainer.py
(cd .. && node zero-trainer --model numberzero.model --samples samples)
