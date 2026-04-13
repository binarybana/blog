+++
title = "The Drake Passage and Ushuaia"
draft = true
date = 2026-03-20
description = ""
tags = [ "thoughts"]

+++


### Leaving Antarctica
We were fortunate to get a beautiful day for starting our passage back. The passage would take 4 days and we were expected to get a fair amount of wind from a nearby storm system peaking around the third day. Fortunately, the wind was projected to be at our back, which for a monohull like this is ideal for stability and motion.

<video controls width="800" height="450" preload="none" poster="https://blob.bask.day/cdn-cgi/image/width=800,format=auto/uploads/4e5f2e1c3d9b41d4-poster.jpg">
  <source src="https://blob.bask.day/uploads/4e5f2e1c3d9b41d4.mp4" type='video/mp4; codecs="av01.0.04M.08"'>
  <source src="https://blob.bask.day/uploads/4e5f2e1c3d9b41d4-h264.mp4" type="video/mp4">
</video>

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/165a15fbdbb7c52c.heic" target="_blank">
  <img alt="Passage 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/165a15fbdbb7c52c.heic"
       width="800" height="1120" loading="lazy" />
</a>

<br/>
<br/>

The view out my bunk porthole:

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/721355826a9bf55d.heic" target="_blank">
  <img alt="Passage 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/721355826a9bf55d.heic"
       width="800" height="1120" loading="lazy" />
</a>

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/0ba6d5e110212bad.heic" target="_blank">
  <img alt="Passage 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/0ba6d5e110212bad.heic"
       width="800" height="1120" loading="lazy" />
</a>

### Miracle drugs
While the seas started out fairly tame, they steadily got rougher. Luckily, Mike came in clutch here, since he had some 


{% raw() %}
<div style="display:flex; gap:0.5rem">
<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/2876ac405b065840.heic" target="_blank">
  <img alt="Passage 1" src="https://blob.bask.day/cdn-cgi/image/width=400,format=auto,dpr=2,trim=500;300;400;200/uploads/2876ac405b065840.heic"
       width="400" loading="lazy" />
</a>
<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/080f878c34143e04.heic" target="_blank">
  <img alt="Passage 1" src="https://blob.bask.day/cdn-cgi/image/width=400,format=auto,dpr=2,trim=140;0;700;500/uploads/080f878c34143e04.heic"
       width="400" loading="lazy" />
</a>
</div>
{% end %}

## Watch schedule
We used a 3 hours on, 6 hours off passage schedule with a staggered rotation. This was my first passage (yes, I know that doing the Drake for your first passage is not recommended) so this was my first time doing this.

Luckily for all watches we had experienced crew on (first column) experienced sailors as backup (second column) and willing hands (speaking for myself) in the third column.

The only weird part of the schedule was you would slowly rotate in and out of different times of the day so you had to check the schedule frequently. Luckily, Gemini generated tables like the one below and I rendered PDFs through typst for everyone to keep offline.

Oh ya, that's one other thing: we didn't have starlink while on the passage. Or we did, but the data rates increase significantly, so the crew reserved it for navigational and weather purposes only.

Here's the first day's schedule so you get a feel for it.

{% raw() %}
<style>
#watch-table th,
#watch-table td { color: var(--text-primary); background-color: var(--bg-content); }
#watch-table thead th { color: var(--text-heading); }
.legend span,
.legend strong { color: var(--text-primary); }
</style>
<div class="container">
    <header>
        <h1 style="margin:0; font-size: 1.4rem;">Watch Bill: Day 1</h1>
        <p style="margin:5px 0 0; opacity: 0.8; font-size: 0.85rem;">3h On / 6h Off (Staggered Rotation)</p>
    </header>

    <div class="legend">
        <span><strong>T+0:</strong> Lead Handoff</span>
        <span><strong>T+1:</strong> Secondary Handoff</span>
        <span><strong>T+2:</strong> Crew Handoff</span>
    </div>

    <table id="watch-table">
        <thead>
            <tr>
                <th>Hour</th>
                <th>Lead (Primary)</th>
                <th>Secondary</th>
                <th>Crew</th>
            </tr>
        </thead>
        <tbody id="table-body">
            <!-- Table content -->
        </tbody>
    </table>
</div>

<script>
    const leads = ["Cath", "Sasha", "Chef"];
    const secondaries = ["Nikki", "Steve", "Mike"];
    const crew = ["J-Dog", "Doug", "Tougy"];

    function initTable() {
        const tbody = document.getElementById('table-body');
        let html = '';
        
        for (let h = 0; h < 24; h++) {
            // Rotation math (9 hour cycle)
            const lIdx = Math.floor(h / 3) % 3;
            const sIdx = Math.floor((h - 1) / 3) % 3;
            const cIdx = Math.floor((h - 2) / 3) % 3;

            // Handle negative modulo for initial offsets
            const getMember = (arr, idx) => arr[((idx % arr.length) + arr.length) % arr.length];

            const isMajorBoundary = h % 3 === 0;
            const borderStyle = isMajorBoundary ? 'class="stagger-group"' : '';

            html += `<tr id="hr-${h}" ${borderStyle}>
                <td class="time-cell">${h.toString().padStart(2, '0')}:00</td>
                <td>${getMember(leads, lIdx)}</td>
                <td>${getMember(secondaries, sIdx)}</td>
                <td>${getMember(crew, cIdx)}</td>
            </tr>`;
        }
        tbody.innerHTML = html;
    }

    function updateHighlight() {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Remove previous highlight
        const prev = document.querySelector('.active-now');
        if (prev) prev.classList.remove('active-now');
        
        // Highlight current
        const row = document.getElementById(`hr-${currentHour}`);
        if (row) {
            row.classList.add('active-now');
        }
    }

    initTable();
    updateHighlight();
    setInterval(updateHighlight, 60000); // Check every minute
</script>

{% end %}

### Night watch while on passage
If this is the right picture here, this is what it looked like while being on passage at night.

You basically can't see anything out the windows, but the ship is moving around like you'll see in the videos below. And you're watching the radar for weather and any return signatures on any icebergs that may be lurking in front of you. We also had a bow light for some of the trip, but it's return on the fog was fairly blinding, so there were good arguments for and against it.

Fortunately, we were lucky to not encounter any icebergs.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/6e4d787b5d94bd81.heic" target="_blank">
  <img alt="Passage 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/6e4d787b5d94bd81.heic"
       width="800" height="800" loading="lazy" />
</a>


### Rollin on da waves
Here was my best take at showing how rough the sea state got during our passage. According to our best guesses, the waves were 10 feet peak to peak with gusts into the 40's (knots, so 46 to 57 MPH).

I would have been quite scared if by myself, but when I asked Nikki and Steve (separately) "how much danger do you feel you are in, scale 1-10?" they both gave answers in the 2-3 range.

Their calm and experience made what objectivelly would be pretty terrifying into a fairly calm and fun experience.

<video controls width="800" height="450" preload="none" poster="https://blob.bask.day/cdn-cgi/image/width=800,format=auto/uploads/98c96b3115dc4339-poster.jpg">
  <source src="https://blob.bask.day/uploads/98c96b3115dc4339.mp4" type='video/mp4; codecs="av01.0.04M.08"'>
  <source src="https://blob.bask.day/uploads/98c96b3115dc4339-h264.mp4" type="video/mp4">
</video>

### Sasha... what are you talking about?
Just chattin' while going through rough-ish seas.

<video controls width="800" height="450" preload="none" poster="https://blob.bask.day/cdn-cgi/image/width=800,format=auto/uploads/e23f98b02d1345d3-poster.jpg">
  <source src="https://blob.bask.day/uploads/e23f98b02d1345d3.mp4" type='video/mp4; codecs="av01.0.04M.08"'>
  <source src="https://blob.bask.day/uploads/e23f98b02d1345d3-h264.mp4" type="video/mp4">
</video>

### Preventer? Never knew her
Here we did an accidental gybe when we heeled particularly far, the boom went into the water (actually fairly normal on this boat) but then the autopilot over-corrected.

This broke the preventer line and wrapped the main sheet around the corner of our cockpit area. It also jammed part of the main entry door (I forget the nautical term for it) which we had to fix later.

I was on watch during this point, so I put on my life jacket and prepared for anything. But mostly I just watched Sasha do some amazing hand steering (the hydralic pump for the steering on this wheel is quite small so you have to turn quite a bit for it to take).

<video controls width="800" height="450" preload="none" poster="https://blob.bask.day/cdn-cgi/image/width=800,format=auto/uploads/038b99ae99ce4f0f-poster.jpg">
  <source src="https://blob.bask.day/uploads/038b99ae99ce4f0f.mp4" type='video/mp4; codecs="av01.0.04M.08"'>
  <source src="https://blob.bask.day/uploads/038b99ae99ce4f0f-h264.mp4" type="video/mp4">
</video>

### Sasha hand steering

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/464aae91e79e70c1.heic" target="_blank">
  <img alt="Passage 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/464aae91e79e70c1.heic"
       width="800" height="1120" loading="lazy" />
</a>

### Going through the strait
Finally as we came to the final day and night, we came into a channel/strait (?) where there were walls on each side. Then going through this at night where you still can't see anything but blackness outside, but your radar is showing clear walls on each side of you.

That kind of "flying by instruments" is also a new experience for me, and the flatness/calmness was a bit eerie actually. A different kind of scary.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/4f0f31f71303f56e.heic" target="_blank">
  <img alt="Passage 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/4f0f31f71303f56e.heic"
       width="800" height="800" loading="lazy" />
</a>


{{ }}

### Stretch your curiosity
Throughout our passage, we wrote down all questions that came to mind as we talked and looked out the windows. So that we could look them all up when we got back to internet. Cath has done this on previous trips and I found it to be a lot of fun.

I pasted this screenshot to Gemini once we got back and it provided a [set of answers here](https://gemini.google.com/share/1ed873cac08e) if you want to see. Some of them required some follow-up as you can see in the conversation there.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/aeaa8fa69b4fe7b6.heic" target="_blank">
  <img alt="Ushuaia 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/aeaa8fa69b4fe7b6.heic"
       width="800" height="800" loading="lazy" />
</a>



### Log book
We tried to keep the comment section interesting. Entries every 1 hour... roughly.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/2570561f432c0f25.heic" target="_blank">
  <img alt="Ushuaia 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/2570561f432c0f25.heic"
       width="800" height="1120" loading="lazy" />
</a>

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/b50ce2d0a770bf47.heic" target="_blank">
  <img alt="Ushuaia 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/b50ce2d0a770bf47.heic"
       width="800" height="1120" loading="lazy" />
</a>



### Birthday cake for Steve!
Cath made some amazing cake considering the ship hadn't provisioned for something like two months. Mayonaisse instead of eggs? Why not!

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/ba2c5858998f2910.heic" target="_blank">
  <img alt="Ushuaia 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/ba2c5858998f2910.heic"
       width="800" height="1120" loading="lazy" />
</a>


### The docks had a lot of really interesting boats in this part of the world
<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/c96c149b2aa1ac82.jpg" target="_blank">
  <img alt="Ushuaia 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/c96c149b2aa1ac82.jpg"
       width="800" height="450" loading="lazy" />
</a>

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/5d2f0ad32bd25d41.jpg" target="_blank">
  <img alt="Ushuaia 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/5d2f0ad32bd25d41.jpg"
       width="800" height="450" loading="lazy" />
</a>




### Walking along boardwalk in Ushuaia

<video controls width="800" height="450" preload="none" poster="https://blob.bask.day/cdn-cgi/image/width=800,format=auto/uploads/735874440869b2ab-poster.jpg">
  <source src="https://blob.bask.day/uploads/735874440869b2ab.mp4" type='video/mp4; codecs="av01.0.04M.08"'>
  <source src="https://blob.bask.day/uploads/735874440869b2ab-h264.mp4" type="video/mp4">
</video>

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/97059a04acd01193.heic" target="_blank">
  <img alt="Ushuaia 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/97059a04acd01193.heic"
       width="800" height="1120" loading="lazy" />
</a>

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/187aeed7ade450b2.heic" target="_blank">
  <img alt="Ushuaia 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/187aeed7ade450b2.heic"
       width="800" height="1120" loading="lazy" />
</a>



### Ushuaia is a ski town apparently

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/57c16c831d346207.heic" target="_blank">
  <img alt="Ushuaia 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/57c16c831d346207.heic"
       width="800" height="800" loading="lazy" />
</a>

### One last hike in patagonia!
Though most people had tapped out at this point to get our first proper showers in 3+ weeks.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/0a88471b95f1aff2.heic" target="_blank">
  <img alt="Ushuaia 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/0a88471b95f1aff2.heic"
       width="800" height="1120" loading="lazy" />
</a>

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/85f7847e09baa091.heic" target="_blank">
  <img alt="Ushuaia 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/85f7847e09baa091.heic"
       width="800" height="800" loading="lazy" />
</a>

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/e65d98ce8b8f6fd6.heic" target="_blank">
  <img alt="Ushuaia 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/e65d98ce8b8f6fd6.heic"
       width="800" height="1120" loading="lazy" />
</a>

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/b48bbc7bc141b562.heic" target="_blank">
  <img alt="Ushuaia 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/b48bbc7bc141b562.heic"
       width="800" height="1120" loading="lazy" />
</a>

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/e2e2da276f78f530.heic" target="_blank">
  <img alt="Ushuaia 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/e2e2da276f78f530.heic"
       width="800" height="450" loading="lazy" />
</a>

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/56c4972d24de83ea.heic" target="_blank">
  <img alt="Ushuaia 1" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/56c4972d24de83ea.heic"
       width="800" height="800" loading="lazy" />
</a>


### I wish I knew more of the geology of these stripes in the rocks

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/f5a867aefc8cd777.heic" target="_blank">
  <img alt="Ushuaia 2" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/f5a867aefc8cd777.heic"
       width="800" height="800" loading="lazy" />
</a>

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/63b79cd351c41de3.heic" target="_blank">
  <img alt="Ushuaia 2" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/63b79cd351c41de3.heic"
       width="800" height="800" loading="lazy" />
</a>

### Mad props for the committment
But even madder props to the devil-may-care attitude about all these seeds in your pants!

Though what did you end up doing to get these pants through customs and their no-seeds rules?

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/5aeae6eba71fcf67.heic" target="_blank">
  <img alt="Ushuaia 2" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/5aeae6eba71fcf67.heic"
       width="800" height="1120" loading="lazy" />
</a>

### Goodbye dinner
There was this great resort in Ushuaia where we spent time reminiscing over stories of the trip and talking about what comes next for each of us.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/3a0f3cb7da363d9a.heic" target="_blank">
  <img alt="Ushuaia 2" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/3a0f3cb7da363d9a.heic"
       width="800" height="1120" loading="lazy" />
</a>

Steve (#2), Cath's husband was able to join us in Ushaia for dinner.
<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/83212c2feb3a39a9.heic" target="_blank">
  <img alt="Ushuaia 2" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/83212c2feb3a39a9.heic"
       width="800" height="1120" loading="lazy" />
</a>

A better shot of the (ruined?) pants.
<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/4a572f47c9e04d1c.heic" target="_blank">
  <img alt="Ushuaia 2" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/4a572f47c9e04d1c.heic"
       width="800" height="1120" loading="lazy" />
</a>

### Dinner
Thanks to Chef here for keeping us to our rule we came up with at dinner: everytime someone drops an F-bomb we have to get up and swap places at the table.

This made it way more fun for two reasons: Sasha and Chef got to finally "let their hair down" now that they were off work and the chemistry of the group just came out in all these interesting ways. At one point, we were holding mock court with Toughy's attorneys (Mike and J-Dog) making the case to the judge and prosecution (Nikki) to her dad Steve (prosecution) on why she should be allowed to go on an overnight road trip with her new boy friend.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/30db72f14ddc3b72.heic" target="_blank">
  <img alt="Ushuaia 2" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/30db72f14ddc3b72.heic"
       width="800" height="800" loading="lazy" />
</a>

### Necessity
We managed to fit 9 of us in a 6 person car. Completely legaly...

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/7dc519c6d5c8908c.heic" target="_blank">
  <img alt="Ushuaia 2" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/7dc519c6d5c8908c.heic"
       width="800" height="800" loading="lazy" />
</a>

### Goodbyes

<video controls width="800" height="450" preload="none" poster="https://blob.bask.day/cdn-cgi/image/width=800,format=auto/uploads/384df26d0de3258f-poster.jpg">
  <source src="https://blob.bask.day/uploads/384df26d0de3258f.mp4" type='video/mp4; codecs="av01.0.04M.08"'>
  <source src="https://blob.bask.day/uploads/384df26d0de3258f-h264.mp4" type="video/mp4">
</video>

### Eating at an outback steakhouse in Buenos Aires airport
Not sure my "beard" has ever been this long.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/4f5b372a8de450a1.heic" target="_blank">
  <img alt="Ushuaia 2" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/4f5b372a8de450a1.heic"
       width="800" height="800" loading="lazy" />
</a>

### Emulsifiers
I sent this picture to the group after returning home.

Very early on in the trip, in a grocery store in Punta Arenas we were gathering salad ingredients when I asked: "what emulsifier do we want to use?" After answering questions about "what is an emulsifier?" "Why do you need it in your salad?" etc, I was never able to live down my obsession about emulsifiers.

So when I looked up the original cook book (Kenjie's amazing Food Lab) I was pleasantly surprised to see that I wasn't the only "obsessive-emulsive."

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/bdd47fdb90ac7468.heic" target="_blank">
  <img alt="Ushuaia 2" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/bdd47fdb90ac7468.heic"
       width="800" height="800" loading="lazy" />
</a>

