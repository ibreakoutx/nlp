
vsananda nlp $ gcloud auth activate-service-account --key-file=../keyfiles/zettachip-e9b2b2135ff3.json
Activated service account credentials for: [821354832966-eeevcb5ki8ov3cdoht1u4l8snejj85lu@developer.gserviceaccount.com]

export GOOGLE_APPLICATION_CREDENTIALS=../keyfiles/zettachip-e9b2b2135ff3.json

gcloud auth application-default print-access-token

#Trick to use access token without
curl -s -k -H "Content-Type: application/json" \
  -H "Authorization: Bearer `gcloud auth application-default print-access-token`" \
    https://language.googleapis.com/v1/documents:analyzeEntities \
      -d @entity-request.json

#---------------------------------------
./run.sh <textfile>

Creates request.json
Submits it to google cloud nlp
Does entity and syntax analysis
#---------------------------------------
