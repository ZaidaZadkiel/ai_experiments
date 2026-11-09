For this experiment, one of the goals is to see how ai will improve the process of designing something with many unknowns and complex relations. 

Another goal is trying to notice how much ai can make difficult coming up with an satisfactory solution for a specific goal.

In this case, the goal was an app which runs different programs, is extensible (does not hardcode or becomes hyperspecific to the point of making extending harder), and whether the ai will actually be focused enough through a long session, and whether a long session makes sense or multiple shorter lived sessions is preferable.

I decided that the main focus on this project would be about the documentation, rather than implementing.

### Tangent and rationale
One of the things i noticed at job, was that ai is really good at exploding symbols, like you can give it a short file and it will produce hundreds of kb of text explaining over and over and over every detail that it comes up.

One of the struggles at job, is that for leadership, it seems easier to create new documents, new presentations, new data dumps instead of coalescing or creating useful coherent and helpful documentation. This ended up starting one week with just a handful of documents, allegedly based on direct client details, ballooning to several spreadsheets, ai documents, even a catalog of a partial list of files which keeps growing to several pages by now. The client's spec is relatively small, for an enterprise job, and extremely undecided on future work. 

At job the ai came up with many details which on a higher level view, seem pretty irrelevant; Went as far as make up wholesale several performance targets which are never mentioned in any of the client's files. The performance targets and testing procedure, was infered by the ai on its own. I imagine that this particular aspect came from the ai framework scaffolding, since at no point it was mentioned that it was a target for the assignment, at least nowhere i could find.

The week was spent trying to untangle the mess of files and trying to trace back to specific claims or details set from the beginning, there were just too few to make sense of the rest. This is not to say that the material ai came with is completely useless, but for the most part, it seems to me that much of it is irrelevant at this stage. Of course, we can feedback it into some degree of certainity, but that sounds like extremely pointless to my sense of how a project needs to be done.

This commentary relates to what i am seeing in this project.

It started with just a vague idea, started telling the ai that the deliverable was a document that was going to be read by a human developer, which helped it focus on creating text.   
Quickly, ai asked about tech stack, which i shut down by saying that all technical details will be handled at a later stage which worked to focus on the high level non-code details.

### Learnings
The previous experiment [test app](first_test_app/test/HUMANLOG.md) shown that ai needs minimal guidance beyond the human decision making. It does not need explicit details, and naturally its processing lends itself very well to symbol explosion, which becomes very useful for fuzzy design work.

It is pretty easy to have ai come up with a multitude of suggestions and relevant-looking questions regarding the subject, it can be useful to notice obvious parts that needs attention.

In my case, i got into the habit of using pseudo-command style prompts. 

>user:  
>consider, if we use X and Y how it would resolve A open question?  
>
>ai:  
>*makes a whole lot of text attempting to answer*
>
>user:  
>query, what is the current details of N?
>
>ai:  
>*writes 3 pages explaining all the details that match N through all files*

From experimentation, i can notice a few things that seem consisten accross the different projects I have seen:
- using ai as a overcomplicated text editor is actually kind of fun
- ai seems to be well suited for coherence matching, it is unknown what sort of limits are to the context of what ai can actually shorten into an useable form
- ai seems to be extremely likely to symbol expand to its own satisfaction, just a 1 line prompt can create a large size of context which may or not be reflected in any document, and it is useful to ask ai to review the unsaved context.
- going thru the ai suggestions can reach a point where the intended objective is buried under way too much specification of lower-level details.  
Example, while deciding on how data is meant to be managed, ai keeps trying to come up with specific topologies for its representation, not settling on a "central" design and making up symbols as it finds them, rather than checking with a work-in-progress format.

Regarding this last point, i noticed that being more strict about how and when to write the documents aided me to figure out what exactly is being discussed.

## File tree
I ended with a structure for the documentation like so,

```text
(certain directories deep in the tree omitted)
.
├── CLAUDE.md
├── data_topology.md
├── file_tree.md
├── MVP_scope.md
├── project_organization.md
├── runner.md
├── security.md
├── toolset.md
└── viewer.md
```

Starting from a singular `CLAUDE.md` and when i noticed there was a new concern being discussed and enough details were settled, i asked ai to write it to each concern file. In this case, i named the files when asking ai to create the contents.

The order in which they were created:
1. [claude](CLAUDE.md)
2. [security](security.md)
3. [toolset](toolset.md)
4. [viewer](viewer.md)
5. [data_topology](data_topology.md)
6. [MVP_scope](MVP_scope.md)
7. [runner](runner.md)

Eventually, the conversation made it clear that there were way too many undecided things to produce something in the same manner as the first excersize, meaning one-shot from the requirements.  
It seems evident that the only way to continue with any degree of certainity, even if ai says that it seems to make sense, was to start with one partial implementation in order to discard misleading decisions.

After that, started on the minimum viable program as a proof of concept.

As of writing this doc, this is the part where im left.


## second day of work
The first day was spent mostly in thinking through the process of using ai, and updating the repository. It was really interesting to consider all the ways this thing can work, it went as far as having me dream about giving instructions to ai, which was really surprising

In the end i started using ai as an overcomplicated text editor, telling what i wanted and having it edit all the relevant files. One thing that was evident, was that ai does not track anything by default, it can happily edit the same files and deleting everything it deems irrelevant, which is nice for a "final" document and quite annoying for a working document.

One of the choices was allowing ai to make up codes, tell it to list everything, and keep references on update.

From the documents it generated at the start, they had a format like `##_topic`, for ex `00_architecture.md`. So I created a new file `99_findings.md` and instructed ai to keep it updated, never removing a code and keeping references to other working files. I felt the need to make sure to say many times that the work was only for mvp, since it has a tendency to want to edit files on the root folder.

Just in theorethical conversation, it was very quickly found that many of the original decisions were insuficent for its purpose, and the findings file quickly grew large. This seems good for me, as it keeps a more "user friendly" way to understand why things were done, which seems to be an important thing that is missing in the other project: ai just goes and does whatever and updates everything and keeps its "deliverable" tidy, but loses all the process information outside.

For a human (me) reviewer, it becomes very easy to just go glass-eyed and say, "sure whatever". Thats not super comfortable on a dev project, since one of the hardest parts which no amount of code can solve, is figuring out why things were done one way or another.

In tradev, the process of figuring out what works and what doesnt is kept in the developer's head, which often is also a problem since a newcomer will have to try figure it out from the code and experience. In the case of ai its even worse, since the entire code can change from one day to the next, and reading the specific detail is too cumbersome.

So far, i find this approach acceptable. There is the issue that the lenght of the file is cumbersome, so perhaps asking ai to make some more human readable document can be useful for some kind of review, that is not a concern for now since the work is not in a "finished" state.

### There are some things that i dont like about this process,
- the process of editing becomes quite annoying, because too much material has been created and edited on each prompt, its pretty hard to know what it actually is doing. This is one of the purposes of this tool, trying to focus on the code part, trying to do *something* to visualize what the program is doing. 
- the way ai just invents codes willynilly, FN-1324, AI-21, WHATEVER-235876 and references it all over the place without me knowing where it came from. In many cases the response announces when it creates new identifiers, but theres no way im going to remember what ID-3910 actually means in the files, or even where it is.  
I have resorted to just opening the entire folder in vscode and use file search to figure out what it even is talking about. Asking ai to shorten what its talking about is annoying and im afraid that it can confuse ai over time, since thats adding more text to the conversation.
- the nagging feeling that i dont know whatever its going on.  
I can just answer on parts of what the last response said, and it likes to raise several points at once. Like i say, "add, x decission" and it will go and modify all things that it finds are affected for it, and from that it makes new questions, ending with "this changes x,y,z, it opens new questions a,b,c,d" and then i can go like, "for a, do this. for b, do that" and it will go do a lot of stuff and then say, "done, c and d are still open" and im like, whatever they were about? and trying to figure out by reading the codes mentioned and what it just wrote.  
that is probably the most annoying part, since not only does it need more attention by me, it also makes it harder to reason about what is being done properly since i would need to review the material that is actually settled; that is natural since there Are changes being made. 

## Progress

In the end, i managed to decide on the way im going to document this exercise (the human log), and i learned a few ways that kind of work. I havent found yet ways that actually mess things up, besides straight up telling ai to do unhelpful things. Im going to leave that for a future experiment.

The ai likes to just go do things and create files all over the place, so the work has already grown quite a bunch, nearing the limits of human review for a single change, so i opened a branch for containment. Ill be adding commits as i work until im satisfied with this part.

One of the things that i liked was forcing myself to drop the work into files for reference, i think thats the most useful part. Perhaps for a future experiment, i may be able to extend the viewer to also try to figure out the aigen codes. I dont know if thats even possible.

the work for the original purpose is proceeding nicely, much farther than what i could do by hand, which is frightning, i still do not have an answer about whether the viewer can actually do what i want in the manner im working. One of the difficult parts is that i dont have full visibility on the data processing, i did dump what ai came up to files for the purpose of examining but, like everything ai does, its too much stuff and really hard to mentally check, i would need to open several files and check piece by piece and that would take a while, and worse, it would be irrelevant on literally the next prompt.

One thing i like, which i believe is the ai doing instructions on its own, is that it does check its work a bunch of times, and it can notice things that are not obvious to me, for example, one data entry is supposed to be `null` with a specific meaning of `not present`, which was implicit in what i was thinking. 

then ai went and did a bunch of changes and on its own noticed that using `null` actually returned an unexpected data (empty) which then it went and reviewd the code and looped through the tests several times until it was satisfied that it could detect null correctly. That was nice.

another case where the ai went and fixed itself was on the `ailog`, since i instructed it to dump a verbatim log of the conversation, it would include identity data like email addresses, so it decided on its own to redact them from the log and wrote its own tool to do that, ran it and found that there were still present. It checked it a few times and noted that the reason was that it was logging the commands it ran, including the parameters for redacting. It went ahead and did who-knows-what several times until it was satisfied that no personal identifiers were present on the log. 

That was kinda cool, i wouldnt have thought of that.

Of crouse, the entire reason I wanted a verbatim log was to try figure out whatever had happened, so i didn't *need* the redaction. Its better safe than sorry i guess.

## mvp file tree
```text
(project root, some files not shown)
├── mvp_docs
│   ├── test_plan
│   │   ├── test-source
│   │   └── README.md
│   ├── zaansouvi-mvp
│   │   ├── ailog
│   │   ├── app
│   │   │   ├── runner
│   │   │   ├── shared
│   │   │   ├── tool-helper
│   │   │   ├── tools
│   │   │   └── viewer
│   │   ├── data
│   │   │   ├── runner
│   │   │   └── tools
│   │   ├── expected
│   │   ├── tests
│   │   ├── test-source
│   │   └── README.md
│   ├── 01_architecture.md
│   ├── 02_data_contracts.md
│   ├── 03_runner.md
│   ├── 04_tools.md
│   ├── 05_viewer.md
│   ├── 06_test_plan.md
│   ├── 07_delivery.md
│   ├── 99_findings.md
│   └── README.md
```

The work now is focusing on figuring out whether the tools can actually talk without knowing what each one does, and the main finding was that runner is going to need to be quite complex. I havent decided anything about how its going to figure out what the data actually means, and i think its best to let that unsettled until we start the actual viewer, which seems pretty hard.

We'll see if theres any more surprises.