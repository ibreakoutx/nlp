#!/bin/sh

while true
do
CURR_IDX=`cat data/num`
EXPR="$CURR_IDX 1 + p"

FILE_SUFFIX=`dc -e "$EXPR"`
echo $FILE_SUFFIX > data/num

#DATE_SUFFIX=`date +%s`
FILENAME=`echo "data/s"$FILE_SUFFIX".txt"`

echo $FILENAME
echo "------ Text input: ^D to end ---->"
cat > $FILENAME
echo "------ Begin processing --------->"
./run.sh $FILENAME
echo "------ End   processing --------->"
echo "--------------------------------->"
done
