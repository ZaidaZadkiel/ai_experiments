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
