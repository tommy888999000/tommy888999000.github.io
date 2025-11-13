var posts=["2025/11/11/我家的猫/","2025/11/07/一张好图/","2025/11/04/这是一篇新的博文/","2025/11/01/hello-world/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };