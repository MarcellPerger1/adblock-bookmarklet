(function(what) {
  var rm = {
    list(elems) {
      Array.from(elems).forEach(v => v.remove())
    }
    cls(name) {
      rm.list(document.getElementsByClassName(name))
    }
    selector(selector) {
      rm.list(document.querySelectorAll(selector))
    }
  }

  for (let name in what) {
    let args = what[name];
    for (let i = 0; i < args.length; i++) {
      let arg = args[i];
      rm[i](arg);
    }
  }
})({
  cls: ['adsbygoogle', 'mod_ad_container']
})
