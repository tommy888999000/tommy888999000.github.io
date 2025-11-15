var posts=["2025/11/15/一个台积电，半部芯片史/","2025/11/14/插图选辑-01/","2025/11/14/亚洲历史上最大的军舰/","2025/11/11/我家的猫/","2025/11/07/一张好图/","2025/11/04/这是一篇新的博文/","2025/11/01/hello-world/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };