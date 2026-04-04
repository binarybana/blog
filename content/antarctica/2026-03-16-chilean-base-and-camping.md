+++
title = "Chilean base and camping"
date = 2026-03-16
description = ""
tags = [ "thoughts"]
+++

One of the benefits of being on a smaller vessel with a well connected crew was being invited to some of the local facilities around the Antarctic peninsula. Here's a map of facilities across Antarcitaca to show you what I mean.

This also helps to give a sense of scale to Antarctica: we didn't get much further south than Vernadsky (third text box down on the upper left) across our entire one month trip. It's a very big continent, about 40% larger than Europe and near the size of South America.

<img src="https://i.redd.it/y9b70j9lm6l51.jpg">

### Arriving at the Chilean military base
So for some reason, penguins seem to love human outposts. I'd guess that the human presence deters (very minorly as we'll see shortly) leopard seals, their main predator.

Unfortunately, this means that the ground becomes layered -- 13 cm on average according to the base commander -- in pengpuin poop and the whole place stinks like the penguin facilities at many zoos. But they are still so cute and both sides seem fine with the other, so I guess it works out in the end?

But it certainly makes for some weird pictures as you'll see below.
 
<video controls width="800" height="450" preload="none" poster="https://blob.bask.day/cdn-cgi/image/width=800,format=auto/uploads/cdba8e867afd3ec9-poster.jpg">
  <source src="https://blob.bask.day/uploads/cdba8e867afd3ec9.mp4" type='video/mp4; codecs="av01.0.04M.08"'>
  <source src="https://blob.bask.day/uploads/cdba8e867afd3ec9-h264.mp4" type="video/mp4">
</video

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/8d2ee6bd868b1ba9.jpg" target="_blank">
  <img alt="Chilean and camping" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2,trim=600;500;1600;0/uploads/8d2ee6bd868b1ba9.jpg"
       width="800" height="600" loading="lazy" />
</a>


### Our parking spot
Stern tied to rocks along the shore.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/872e8f956e7b5310.jpg" target="_blank">
  <img alt="Chilean and camping" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/872e8f956e7b5310.jpg"
       width="800" height="450" loading="lazy" />
</a>


### The base gift shop
I expect this is a big reason we get invites to the barbeque: so the troops (and base?) can make a little side money with their patches, coins, and other memorabilia. Win-win! And they get some excitement beyond the penguin antics.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/0dcc6eeb8d0dbfb5.jpg" target="_blank">
  <img alt="Chilean and camping" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/0dcc6eeb8d0dbfb5.jpg"
       width="800" height="600" loading="lazy" />
</a>


### Counting penguins
One of the jobs of the local air force personnel is to do a weekly penguin count around the base. They used to do this by manually counting penguins from drone footage but the commander was describing his new process to me: since they'd just installed a new starlink antenna they are now able to give the images to ChatGPT and ask it to count the penguins for them.

I shudder to think of the hallucination rate for this measurement methodology but I really love the enthusiasm of this new tech adoption! To be fair, I don't actually know how LLM's fare on this type of image segmentation and counting problem. It's possible it's fairly accurate. But just like the famous "strawberry R counting" problem, tokenization (in this case of image patches) is fraught with danger.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/ada78ca84b5b0028.jpg" target="_blank">
  <img alt="Chilean and camping" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/ada78ca84b5b0028.jpg"
       width="800" height="600" loading="lazy" />
</a>


### Far away from everything
I think the reason they build these down here is that Antarctica is very far away from _everything_. A fact used for the title of a [recent memoir](https://michelleott.com/portfolio/outer-space-is-closer-than-antarctica/) I saw at the bookstore: "Outer Space Is Closer Than Antarctica".

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/e531c2e9976dfac7.jpg" target="_blank">
  <img alt="Chilean and camping" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/e531c2e9976dfac7.jpg"
       width="800" height="600" loading="lazy" />
</a>

Here's a plot Gemini made for me to show the point:
{% raw() %}
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config = { darkMode: ['class', '.dark-mode'] }</script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    </style>
    <div class="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 md:p-10 border border-slate-100 dark:border-slate-700">
        <header class="mb-8 text-center">
            <h1 class="text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-3">
                <span class="text-blue-500">🌍</span>
                Space is Closer Than You Think
            </h1>
            <p class="text-slate-600 dark:text-slate-300 mt-2 text-lg">Distances from Seattle, WA
            </p>
        </header>

        <div class="flex justify-end mb-6">
            <div class="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <button id="linearBtn" onclick="updateScale('linear')" class="px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100">
                    Linear
                </button>
                <button id="logBtn" onclick="updateScale('logarithmic')" class="px-4 py-1.5 rounded-md text-sm font-medium transition-all text-slate-500 dark:text-slate-400 hover:text-slate-700">
                    Logarithmic
                </button>
            </div>
        </div>

        <div class="relative h-[400px] w-full">
            <canvas id="distanceChart"></canvas>
        </div>

        <section class="mt-10 grid md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-700 pt-8">
            <div class="bg-indigo-50 dark:bg-indigo-950 p-5 rounded-xl flex gap-4">
                <div class="text-2xl">🚀</div>
                <div>
                    <h3 class="font-bold text-indigo-900 dark:text-indigo-300 uppercase text-xs tracking-wider mb-1">The Vertical Insight</h3>
                    <p class="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">
                        If you could drive your car straight up at freeway speeds, you would reach outer space (the Kármán line) in about <b>50 minutes</b>.
                    </p>
                </div>
            </div>

            <div class="bg-blue-50 dark:bg-blue-950 p-5 rounded-xl flex gap-4">
                <div class="text-2xl">📍</div>
                <div>
                    <h3 class="font-bold text-blue-900 dark:text-blue-300 uppercase text-xs tracking-wider mb-1">The Terrestrial Reality</h3>
                    <p class="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                        Reaching Antarctica from Seattle requires traveling ~14,600 km—nearly <b>146 times farther</b> than the edge of space.
                    </p>
                </div>
            </div>
        </section>

        <footer class="mt-8 flex items-start gap-2 text-slate-400 text-xs italic leading-snug">
            <span>ℹ️</span>
            <p>
                Distances are approximate great-circle calculations to New York (JFK) and McMurdo Station, Antarctica. Space boundary defined by the FAI Kármán line ($100\text{ km}$). Low Earth Orbit (ISS) altitude is approx. $408\text{ km}$.
            </p>
        </footer>
    </div>

    <script>
        const isDark = () => document.documentElement.classList.contains('dark-mode');
        const tickColors = () => isDark()
            ? { x: '#94a3b8', y: '#cbd5e0' }
            : { x: '#64748b', y: '#475569' };

        const ctx = document.getElementById('distanceChart').getContext('2d');
        const dataValues = [100, 408, 3865, 14600];
        const labels = ['Kármán Line (Space)', 'ISS (Orbit)', 'New York City', 'Antarctica'];
        const colors = ['#6366f1', '#4f46e5', '#94a3b8', '#0ea5e9'];

        let chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: colors,
                    borderRadius: 6,
                    barThickness: 35
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => ` ${context.parsed.x.toLocaleString()} km`
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        beginAtZero: true,
                        grid: { display: false },
                        ticks: {
                            callback: (value) => value.toLocaleString() + ' km',
                            color: tickColors().x
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            font: { weight: '600' },
                            color: tickColors().y
                        }
                    }
                }
            }
        });

        new MutationObserver(() => {
            const tc = tickColors();
            chart.options.scales.x.ticks.color = tc.x;
            chart.options.scales.y.ticks.color = tc.y;
            chart.update('none');
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        function updateScale(type) {
            const linearBtn = document.getElementById('linearBtn');
            const logBtn = document.getElementById('logBtn');
            const activeClasses = ['bg-white', 'dark:bg-slate-600', 'shadow-sm', 'text-slate-900', 'dark:text-slate-100'];
            const inactiveClasses = ['text-slate-500', 'dark:text-slate-400'];

            if (type === 'logarithmic') {
                chart.options.scales.x.type = 'logarithmic';
                chart.options.scales.x.min = 10;
                logBtn.classList.add(...activeClasses);
                logBtn.classList.remove(...inactiveClasses);
                linearBtn.classList.remove(...activeClasses);
                linearBtn.classList.add(...inactiveClasses);
            } else {
                chart.options.scales.x.type = 'linear';
                chart.options.scales.x.min = 0;
                linearBtn.classList.add(...activeClasses);
                linearBtn.classList.remove(...inactiveClasses);
                logBtn.classList.remove(...activeClasses);
                logBtn.classList.add(...inactiveClasses);
            }
            chart.update();
        }
    </script>
{% end %}


### A view of the barbequeue
I'm definitely just tired here... or blinking... or both. Four of the Argentinians came over from their base (a 30 minute dingy ride away) and one of them in particular was very eager to pour us lots of the Arginitinian spirits (like the Russians on Amazone). I managed to fend him off for a while by putting a giant ice cube blocking the top of my mug (so he could neither see nor pour me anything). Until he finally "helped" me by breaking up my ice cube and filling my drink back up to the top.

And the thing above me is a pull-up bar for exercise. I _really_ wanted to climb it, but it was too crowded and our Argentinian friend did not socially lubricate me enough for that.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/79cf2226128abba2.jpg" target="_blank">
  <img alt="Chilean and camping" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/79cf2226128abba2.jpg"
       width="800" height="600" loading="lazy" />
</a>



### Out of Gas
Literally, we ran out of diesel in the middle of the party, and one of the base operators had to run over to switch us to the other tank. All electricity on the station comes from a diesel generator that runs 24/7.

My brain boggles at the amount of fuel they could likely save with a battery pack and intermittently running the diesel at a more efficient duty cycle for their loads.


<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/a87c95bbe9b8da42.jpg" target="_blank">
  <img alt="Chilean and camping" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/a87c95bbe9b8da42.jpg"
       width="800" height="450" loading="lazy" />
</a>



### Grill
Their barbeque grilling skills and results did not disappoint!

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/31e7ac2ac78036db.jpg" target="_blank">
  <img alt="Chilean and camping" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/31e7ac2ac78036db.jpg"
       width="800" height="600" loading="lazy" />
</a>

Another thing weird about this barbeque was the stark contrasts between how weird and normal it simultaneously was:
* Normal
  * The friendly guy at the party trying to pour you more drinks
  * The small talk and awkward "getting to know each other" topics.
  * The further bonding of the core group that you came to the party with
  * Someone making a fool of themselves doing karaoke by picking a song they didn't know (glad I wasn't that guy... how embarassing that would have been...)
* Abnormal
  * Running out of diesel fuel for building's generators
  * Looking out the window and seeing a field of sleeping penguins
  * Having to park your dingy on the way to the party (okay for the sailors this goes in the normal category, but for 99% of the readers of this blog it's very weird)
  * Knowing that you are incredibly isolated. Arguably at the "edge of the world"
  * Having an incredible variance of nationalities and life experiences represented (Chile, Argentina, USA, Australia, Ukraine, Russia, UK, were the ones I personally talked to)


## Antarctic Camping
The next day, we anchored next to a spot of land where it was flat enough for us to camp on for the night. This way, we could all say we had slept on the Antarctic mainland.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/4453fa92af5e5fa9.jpg" target="_blank">
  <img alt="Chilean and camping" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/4453fa92af5e5fa9.jpg"
       width="800" height="600" loading="lazy" />
</a>

Three out of four of our tents pictured here.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/040841e6f4cc8ba3.jpg" target="_blank">
  <img alt="Chilean and camping" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/040841e6f4cc8ba3.jpg"
       width="800" height="600" loading="lazy" />
</a>

Navigation aid? Both visual and perhaps radar return signal (corrugated metal?). 

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/0de642503efb510e.jpg" target="_blank">
  <img alt="Chilean and camping" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/0de642503efb510e.jpg"
       width="800" height="600" loading="lazy" />
</a>

For entertainment before bed, we made up some games with some rocks and extra boards we found from the navigation aid. The group was really creative in remixing the clasic games of:
* Tic tac toe
* Boceball
* Marbles
* Horse/four square

into many genuinely-fun new arrangements.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/c5d3288643446b22.jpg" target="_blank">
  <img alt="Chilean and camping" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/c5d3288643446b22.jpg"
       width="800" height="600" loading="lazy" />
</a>

### Sleeping and waking up in the morning
Sleeping on Antarctica was weird. It was:
1. Incredibly quiet. It was a low wind night, so without bugs, cars, airplanes or waves, it was so quiet that the only thing I could hear far, far in the distance was the sound of whale's breathing every few minutes. And then in early the morning I heard some curious penguins come closer to our tents to investigate.
2. Cold. Okay I'm just a sissy, I have a "5 degree (Fahrenheit) bag" and I wore most of my long john layers but I still was cold. Non-shivering luckily. We didn't have any outdoor thermometers, but I'd guess it was in the low 30's or high 20's. I can't even begin to imagine what it would feel like in the -80 regime which is what it gets to in the interior during the wintertime.
3. Fun!

And then waking up and being surrounded by views like this kept the surreal unreality of the trip going.

<a href="https://blob.bask.day/cdn-cgi/image/format=auto/uploads/ce988627b86aaa6a.jpg" target="_blank">
  <img alt="Chilean and camping" src="https://blob.bask.day/cdn-cgi/image/width=800,format=auto,dpr=2/uploads/ce988627b86aaa6a.jpg"
       width="800" height="600" loading="lazy" />
</a>



