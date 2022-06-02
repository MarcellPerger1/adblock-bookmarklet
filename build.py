import re

def make_bookmarklet(src: str):
  ...
  return src

def build():
  with open('./adblocker.js') as f:
    src = f.read()
  text = make_bookmarklet(src)
  with open('./bookmarklet.txt') as f:
    f.write(text)

if __name__ == '__main__':
  build()
