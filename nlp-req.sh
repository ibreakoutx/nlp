#!/bin/bash

curl -s -k -H "Content-Type: application/json"   -H "Authorization: Bearer `gcloud auth application-default print-access-token`"   https://language.googleapis.com/v1/documents:analyzeEntities   -d @request.json > entity.json
if [ $? -ne 0 ]; then
  echo "Error running entity analysis"
  exit 1
fi
head -10 entity.json

curl -s -k -H "Content-Type: application/json"   -H "Authorization: Bearer `gcloud auth application-default print-access-token`"   https://language.googleapis.com/v1/documents:analyzeSyntax   -d @request.json > syntax.json
if [ $? -ne 0 ]; then
  echo "Error running syntax analysis"
  exit 1
fi
head -10 syntax.json
