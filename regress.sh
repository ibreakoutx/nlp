for fn in `ls -C1 data/s*.txt`;  do
    echo "$fn"
    ./run.sh $fn
done
