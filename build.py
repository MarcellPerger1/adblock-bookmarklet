import re

def make_bookmarklet(s: str):
  s = s.replace("\n", " ")
  s = re.sub(r"""(?<![\w\$])\s*|\s*(?![\w\$])""", '', s)
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
