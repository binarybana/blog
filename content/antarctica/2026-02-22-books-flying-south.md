+++
title = "Books flying south"
draft = true
date = 2026-03-01
description = ""
tags = [ "thoughts"]

+++

Last summer, my friend Cas steered me to the idea of using LLMs to get book recommendations based (why didn't I think of that?). Specifically, providing detailed lists of books I liked, didn't like, and why for the LLM to generate curated lists for my tastes.

So I proceeded to:
1. Comb through my goodreads profile and grab all of the books I enjoyed over the last few years. <sidenote>I've never found goodreads to be useful for much up until now, but the fact that Kindle automatically adds books to Goodreads makes it a good log of  all books read/attempted.</sidenote>
2. Build a prompt that includes the book list above, and asks it to cluster these books into themes.
3. With these clusters, build another prompt asking for a set of recommendations in each cluster.
