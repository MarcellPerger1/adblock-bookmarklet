(function(ls){
  function rm_cls(name){
    Array.from(document.getElementsByClassName(name))
      .forEach(v=>v.remove())
  }
  ls.forEach(rm_cls)
})(['adsbygoogle','mod_ad_container'])
