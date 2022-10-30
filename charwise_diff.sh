USAGE="usage: $0 from-file to-file"
for arg; do 
    if test "$arg" == '--help' || test "$arg" == '-h'; then 
        echo $USAGE
        exit
    fi
done
if [ -z "$1" ]; then
    echo $USAGE
    exit
fi
if [ -z "$2" ]; then
    echo $USAGE
    exit
fi
git diff --no-index --word-diff=color --word-diff-regex=. $1 $2