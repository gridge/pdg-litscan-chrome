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
Note: 
 General notes
URL: 
 Pattern to be put in the "permissions" section of manifest.json to activate content script
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


*** PRL,PRD,PRC,PRX
Note: 
 We get DOI from
 <p class="doi">DOI: http://dx.doi.org/10.1103/PhysRevLett.114.081802</p>
 which is the only class="doi" element.
URL: 
 http://journals.aps.org/pr*/abstract/*
Journal: 
 We get DOI from 
Number, Page: 
 From DOI
Author: 
 <h6 class="authors">G. Aad <em>et al.</em> (ATLAS Collaboration)</h6> 
 [Only occurrence of class="authors"]
Year: 
 <meta content="2015-02-26" property="article:published_time" />
Link: 
 Use DOI

*** Physics Letters B, Nuclear Physics A, Nuclear Physics B, Physics Reports
Note: 
 Content is loaded dynamically via AJAX call. Info buried into <script> tag
URL: 
 www.sciencedirect.com/science/article/pii/*

*** JHEP
Note: 
 All info into <meta> field. Thanks Springer!
 We can get DOI from:
 <meta name="citation_doi" content="10.1007/JHEP03(2015)008"/>
URL: 
 http://link.springer.com/article/*
Journal, Number, Page:
 from DOI or 
 <meta name="citation_journal_title" content="Journal of High Energy Physics"/>
 <meta name="citation_volume" content="2014"/>
 <meta name="citation_issue" content="3"/>
 [but number of paper from DOI]
Author:
 <meta name="citation_author" content="Thomas W. Grimm"/>
 [Use first one, OK for collaborations]
Year:
 From volume
Link:
 Create from DOI appending prefix:
 http://dx.doi.org/

