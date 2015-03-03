INTRO
---------
This is a simpel chrome extension allowing to make the job of literature search a little more quick.


RANDOM NOTES
---------
- Develop a new journal parsing
   - Add journal URL in the manifest.json "permissions" field.


TODO
---------


JOURNAL INFO
---------
This section describes what info and how is encoded in metadata of each journal.


*** Template for new journals (add more field as needed for special cases indicating how they're used)
URL: Pattern to be put in the "permissions" section of manifest.json to activate content script
Journal: 
 Name of journal (to be translated into a PDG code)
Number: 
 Issue number
Page: 
 Article page or number
Author: 
 First author
Year: 
 Year it was published
Link: 
 Link to DOI (preferred) or journal URL


*** PRL
URL: http://journals.aps.org/prl/abstract/*
Journal: 
 You already know from URL pattern. As x-check can use:
 <meta content="Physical Review Letters" property="og:site_name" />
 Alternatively we can also use:
 <h5 class="pub-info">Phys. Rev. Lett. <b>114</b>, 081802 – Published 26 February 2015</h5>
 which is the only class="pub-info" and gets also the Number/Page/Year field once parsed [but somehow a bit more convoluted]
Number, Page: 
 We can use meta:
 <meta content="http://journals.aps.org/prl/abstract/10.1103/PhysRevLett.114.081802" property="og:url" />
 or DOI info (see below) or even
 <h5 class="pub-info"> [but somehow a bit more convoluted]
Author: 
 <h6 class="authors">G. Aad <em>et al.</em> (ATLAS Collaboration)</h6> 
 [Only occurrence of class="authors"]
Year: 
 <meta content="2015-02-26" property="article:published_time" />
Link: <link href="http://link.aps.org/doi/10.1103/PhysRevLett.114.081802" rel="canonical" /> 
 [Note is the first one with "rel=\"canonical\"", but not the first link]
 Alternatively there's:
 <p class="doi">DOI: http://dx.doi.org/10.1103/PhysRevLett.114.081802</p>
 which is the only class="doi" element.
