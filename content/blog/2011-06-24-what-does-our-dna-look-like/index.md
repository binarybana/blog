+++
title = "What does our DNA look like?"
permalink = "/2011/06/what-does-our-dna-look-like.html"
date = 2011-06-24T22:03:00Z
updated = 2011-06-24T22:03:57

[blogger]
siteid = "15125061"
postid = "6894859864234986076"
comments = "2"

[author]
name = "Jason Knight"
url = "https://plus.google.com/102340116383554399495?rel=author"
image = "//lh5.googleusercontent.com/-7hdboMymj1U/AAAAAAAAAAI/AAAAAAAAJXI/7HfgmM-lRPQ/s512-c/photo.jpg"

+++

<div class="css-full-post-content js-full-post-content">
Everyone has seen the DNA double helix (if not<a href="http://en.wikipedia.org/wiki/DNA"> click here right now</a>), but what does your DNA look like as an image?<br /><br />Specifically, I was daydreaming today when I thought: what if someone took one of the sequenced human genomes out there and converted all the letters into corresponding colors for the pixels of an image?<br /><br />I decided that that someone was going to be me!<br /><br />And a few minutes later with somewhere north of 25 google searches (where do I download the human genome? How do I remove newlines and capitalize letters with awk? How can I write PNGs with Haskell? What color code is a 32bit RGBA PNG in its header? etc...) I had my answer:<br /><br />

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/2026-02-02-002157-wij5l739.png" target="_blank">
  <img alt="Untitled" src="https://blob.bask.day/cdn-cgi/image/width=300,format=auto/uploads/2026-02-02-002157-wij5l739.png"
       width="300" height="300" loading="lazy" />
</a>

<div class="separator" style="clear: both; text-align: center;"><br /></div>The colors represent nucleotide base pairs: A (red), T (green), G (blue), C (yellow), and gray for unknown bases (N). You'll notice large gray blocks, especially in the second half - that's because over 50% of the Y chromosome remains unsequenced in the reference genome. The Y has massive heterochromatic regions and a centromere full of repetitive DNA that's extremely difficult to sequence.<br /><br />Now, a few caveats: This is only a portion of the Y chromosome of the <a href="http://hgdownload.cse.ucsc.edu/downloads.html#human">19th human sequenced</a>. It really doesn't look like much does it? But it was a fun exercise for the 30 minutes or so before I headed home for the weekend.<br /><br />The code (almost all of which came from <a href="http://www.haskell.org/haskellwiki/Library/PNG">this PNG example</a>) can be <a href="dna_image.py">found here</a>. It is very ugly and does not use Haskell as it was meant to be used. But it gets the job done!<br /><br />Please let me know if you have any suggestions as to making the image prettier/more informative. Perhaps I should indicate the location of TATA boxes or Poly-A tails etc... Maybe I'll find some time to do it too!<br /><br />Just imagine that most of that is inside of us (the guys anyways, sorry ladies!), inside of every cell in our bodies in fact. Kinda neat if you ask me.<br /><br /><b>Update (2026):</b> The original Haskell code and image were lost to link rot. I recreated the visualization in Python with Claude Code. The new image shows the complete Y chromosome from the hg38 human reference genome (57 million nucleotides as a 7565x7565 pixel image). The <a href="dna_image.py">Python script</a> can be run with <code>uv run dna_image.py</code>.
</div>
<div class="css-full-comments-content js-full-comments-content">
<div class="css-full-comment js-full-comment">
  <div class="css-comment-user-link js-comment-user-link">
  <a href="http://www.blogger.com/profile/11137554613812815716">
  <div class="css-comment-name js-comment-name">
    Austin
  </div>
  </a>
  <div class="css-comment-date js-comment-date">
    2011-07-05T05:02:06.240Z
  </div>
  </div>
  <div class="css-comment-content js-comment-content">
    Nice work Jason, cool to see your using Haskell as well.  Maybe I&#39;ll try it out on some of the other chromosomes or maybe tweak it a bit if you&#39;re cool with that.  Anyway, that&#39;s only if I find some time, but I&#39;ll let you know.
  </div>
  <br/>
</div>
<div class="css-full-comment js-full-comment">
  <div class="css-comment-user-link js-comment-user-link">
  <a href="http://www.blogger.com/profile/00649400936159605312">
  <div class="css-comment-name js-comment-name">
    Jason Knight
  </div>
  </a>
  <div class="css-comment-date js-comment-date">
    2011-07-05T12:58:30.000Z
  </div>
  </div>
  <div class="css-comment-content js-comment-content">
    Thanks Austin! I&#39;d love for you to tweak it. There are a lot of cool things that could be done with it. I look forward to seeing it :).
  </div>
  <br/>
</div>
</div>
