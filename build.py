import re

def make_bookmarklet(src: str):
  s = re.sub('\\n\\s*', '', src)
  s = 'javascript:' + s
  return s

def build():
  with open('./adblocker.js') as f:
    src = f.read()
  text = make_bookmarklet(src)
  with open('./bookmarklet.txt', 'w') as f:
    f.write(text)

if __name__ == '__main__':
  build()
