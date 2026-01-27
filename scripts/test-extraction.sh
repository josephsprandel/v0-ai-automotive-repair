#!/bin/bash
cd /home/jsprandel/roengine

# Test with Honda Accord manual
node scripts/extract-maintenance-schedule.js \
  /home/jsprandel/test-manuals/2020_honda_accord.pdf \
  2020 \
  Honda \
  Accord
