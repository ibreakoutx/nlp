#!/bin/sh

export GOOGLE_APPLICATION_CREDENTIALS=../keyfiles/zettachip-e9b2b2135ff3.json

#Create request json from input text file
node app.js $1
if [ $? -ne 0 ]; then
  echo "Error creating request.json"
  exit 1
fi

#Dispatch NLP analysis to google cloud
./nlp-req.sh

node analyze.js
