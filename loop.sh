#!/bin/sh

while true
do
DATE_SUFFIX=`date +%s`
FILENAME=`echo "data/s-"$DATE_SUFFIX".txt"`

echo "------ Text input: ^D to end ---->"
cat > $FILENAME
echo "------ Begin processing --------->"
./run.sh $FILENAME
echo "------ End   processing --------->"
echo "--------------------------------->"
done
