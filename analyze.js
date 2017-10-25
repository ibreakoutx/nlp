/*
Take in nlpraw, entity and syntax json
Produce source, destination, num travellers, etc
*/
var _ = require('underscore');



//------------------------------------
//Easy way to read in json files
//------------------------------------
var nlpraw = require("./nlpraw.json");
var entity = require("./entity.json");
var syntax = require("./syntax.json");

//Result dictionary
var RESULT = {};

//------------------------------------------------------------------------------
//Word keys, store synonyms
//------------------------------------------------------------------------------
var destinationkeys = ['to','for'];
var originkeys = ['from','back','return'];
var datekeys = {
  'depart': ['depart','leave','fly','fly out','go','go out','step out','start',
              'start out','get away','go away','hit the road','arrive', 'travel',
              'vacation'
               ],
  'return':['return','come', 'come back', 'be','be back','back','reenter']
};

//Month synonyms
var monthkeys = [ 'jan' , 'january' , 'feb', 'february', 'mar', 'march',
  'apr','april','may','jun','june','july','jul','aug','august','sep',
  'september','oct','october','nov','november','dec','december'
];

//month idx corresponding to monthkeys entries above
var monthidx = [ 1 , 1 , 2, 2, 3, 3,
   4 , 4 , 5 , 6 , 6 , 7 , 7 , 8 , 8 , 9 ,
   9 , 10 , 10 , 11 , 11 , 12 , 12
];

//Quantity synonyms
var quantitykeys = ['buy','ticket','person'];

//Duration synonyms
var durationkeys = ['night','day','week','month','year','fortnight'];
//------------------------------------------------------------------------------

/*
Format of entity.json
{
  "entities": [
    {
      "name": "tickets",
      "type": "OTHER",
      "metadata": {},
      "salience": 0.4612802,
      "mentions": [
        {
          "text": {
            "content": "tickets",
            "beginOffset": 15
          },
          "type": "COMMON"
        }
      ]
    },
    {
      "name": "people",
      "type": "PERSON",
      "metadata": {},
      "salience": 0.1781294,
      "mentions": [
        {
          "text": {
            "content": "people",
            "beginOffset": 29
          },
          "type": "COMMON"
        }
      ]
    },
    {
      "name": "austin",
      "type": "OTHER",
      "metadata": {},
      "salience": 0.1781294,
      "mentions": [
        {
          "text": {
            "content": "austin",
            "beginOffset": 42
          },
          "type": "COMMON"
        }
      ]
    },
    {
      "name": "london",
      "type": "LOCATION",
      "metadata": {},
      "salience": 0.12201704,
      "mentions": [
        {
          "text": {
            "content": "london",
            "beginOffset": 52
          },
          "type": "COMMON"
        }
      ]
    }
  ],
  "language": "en"
}
*/

//All entities regardless of type
var rawEntityList = entity['entities'];
console.log('ENTITIES :' + _.pluck(rawEntityList, 'name'));

/*
Syntax tree
{
  "sentences": [
    {
      "text": {
        "content": "i want  to buy tickets for 4 people  from austin to london in july.",
        "beginOffset": 0
      }
  ],
  "tokens": [
    {
      "text": {
        "content": "i",
        "beginOffset": 0
      },
      "partOfSpeech": {
        "tag": "PRON",
        "aspect": "ASPECT_UNKNOWN",
        "case": "NOMINATIVE",
        "form": "FORM_UNKNOWN",
        "gender": "GENDER_UNKNOWN",
        "mood": "MOOD_UNKNOWN",
        "number": "SINGULAR",
        "person": "FIRST",
        "proper": "PROPER_UNKNOWN",
        "reciprocity": "RECIPROCITY_UNKNOWN",
        "tense": "TENSE_UNKNOWN",
        "voice": "VOICE_UNKNOWN"
      },
      "dependencyEdge": {
        "headTokenIndex": 1,
        "label": "NSUBJ"
      },
      {
        "text": {
          "content": "want",
          "beginOffset": 2
        },
        "partOfSpeech": {
          "tag": "VERB",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "INDICATIVE",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "PRESENT",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 1,
          "label": "ROOT"
        },
        "lemma": "want"
      },
      {
        "text": {
          "content": "buy",
          "beginOffset": 11
        },
        "partOfSpeech": {
          "tag": "VERB",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 1,
          "label": "XCOMP"
        },
        "lemma": "buy"
      },

*/

//Extract all token objects
var TOKENS = syntax['tokens'];

//Flatten structure for easier data retrievel
//Move up some of these f**** nested properties
//so underscore has an easier time
TOKENS.forEach( (tk,idx) => {

  //actual word
  tk['word'] = tk['text']['content'];

  //Current idx of token
  tk['idx'] = idx;

  //part of speech
  tk['tag'] = tk['partOfSpeech']['tag'];

  //Is a proper noun
  tk['isProper'] = (tk['partOfSpeech']['proper'] == 'PROPER');

  //index of parent
  tk['pidx'] = tk['dependencyEdge']['headTokenIndex'];

  //position in raw string
  tk['posn'] = tk['text']['beginOffset'];

});

//Flatten the entity datastructure, need beginOffset to map
//to token index
var ENTITIES = [];
rawEntityList.forEach( (entity,idx) => {
  var mentions = entity['mentions'];
  mentions.forEach( (mention) => {
    var obj = {};
    obj['name'] = entity['name'];
    obj['type'] = entity['type'];
    obj['posn'] = mention["text"]["beginOffset"];
    obj['innertype'] = mention['type'];
    obj['salience'] = entity['salience'];

    //TODO: see if underscore equivalent to find
    //an element in a list
    TOKENS.forEach( (tk,tidx) => {
      if ( tk['posn'] == obj['posn'] ) {
        obj['tidx'] = tidx ;
      }
    });

    ENTITIES.push(obj);
  });
});

console.log('Entity list : ' + JSON.stringify(ENTITIES));

//For each word store its parent (lemmatized)
//TODO: Traversing the tree with the parent name can
//result in a wrong tree traversal, for example there might
//be a word like 'to' repeated multiple times. So we might
//pick the wrong 'to' and proceed incorrectly.
TOKENS.forEach( (tk) => {
  //For the root word index and parent index will
  //be the same, set parent as undefined then
  //Needed for recursive call definitions to terminate
  if ( tk['idx'] == tk['pidx'] )
    tk['parent'] = undefined;
  else
    //parent word
    tk['parent'] = TOKENS[tk['pidx']]['lemma'];
});

//Find all children for each node
TOKENS.forEach( (p) => {
  var children = [];
  var childrenidx = [];
  var childrenposn = [];

  var name = p['lemma'];
  TOKENS.forEach( (c,i) => {
    if (c['parent'] == name ) {
      children.push(c['lemma']);
      childrenidx.push(i);
      childrenposn.push(c['posn']);
    }
  });

  p['children'] = children ;
  p['childrenidx'] = childrenidx;
  p['childrenposn'] = childrenposn;
});


//Entities with type of location, this is to give us a hint on
//source and destination
//In example above, 'austin' is recognized as an entity but not
//of type 'location'
var locations = _.where(ENTITIES, {'type':'LOCATION'});
console.log('LOCATIONS :' + JSON.stringify(locations));

//Find nouns
var nouns = _.where(TOKENS, {'tag':'NOUN'});
console.log( 'NOUNS :' + _.pluck(nouns,'lemma'));

//Find numbers
var nums = _.where(TOKENS,{'tag':'NUM'});

//List of number positions
var numposnlist = _.pluck(nums,'posn');
console.log( 'Numbers :' + _.pluck(nums,'lemma'));

//Find source and destination
//Find parent of location names, if parent is one of the destinationkeys then we
//have found the destination.
var locationsFound = [];
function findSourceDestination(list) {
  list.forEach( (loc) => {
    console.log('loc[name] :' + loc['name']);
    var name = loc['name'];

      //Find list of locations, these can correspond to multiple tokens
      //like san francisco, los angeles etc.
      //In these cases tracing back from the root will not work.
      //So split entity/location name on 1 or more spaces , using regex \s+
      if ( name.split(/\s+/).length > 1 )
        name = name.split(/\s+/)[0];

      //Only visit locations not already classified as source or destination
      if ( locationsFound.indexOf(loc['name']) == -1 && RESULT['to'] == undefined ) {
        if( findParentMatchByIndex( loc['tidx'], arrayFind, destinationkeys ) ) {
          RESULT['to'] = loc['name'];
          console.log('RESULT[to]: ' + RESULT['to']);
          locationsFound.push(loc['name']);
        }
      }

      if ( locationsFound.indexOf(loc['name']) == -1 && RESULT['from'] == undefined ) {
        if( findParentMatchByIndex( loc['tidx'], arrayFind, originkeys ) ) {
          RESULT['from'] = loc['name'];
          console.log('RESULT[from]: ' + RESULT['from']);
          locationsFound.push(loc['name']);
        }
      }
  });
}

//Associate locations from source and destination
findSourceDestination(locations);

//If either source or destination not set
if ( !(RESULT['to'] && RESULT['from']) )
  findSourceDestination(ENTITIES);

console.log('locationsFound: ' + locationsFound);

//Find parent index that returns true for function passed
function findParentMatchByIndex(idx, fn, arg) {
  var rval ;
  console.log('findParentMatchByIndex :' + TOKENS[idx]['word'] + ' arg:' + arg) ;
  var parentIdx = getParentByIndex(idx);

  if ( parentIdx == undefined )
    rval=false ;
  else {
        if ( fn(arg,TOKENS[parentIdx]['lemma']) )
          rval = true;
        else
          rval = findParentMatchByIndex(parentIdx,fn,arg);
    }
    return rval;
}

//Return idx of parent
//If root node, return undefined.
//In TOKENS array, ROOT will have idx == parent index
function getParentByIndex(idx) {
    var pidx = TOKENS[idx]['pidx'];
    if (pidx == idx)
      return undefined;
    else
      return pidx;
}

function getParentByName(name) {
    var tk = _.find(TOKENS,(t) => { return t['lemma'] == name ;});

    if ( tk != undefined )
      return tk['parent'];
    else {
      return undefined;
    }
}

//Print all parents
console.log('<---------------------------------------------->');
console.log('<--------- Parent Relationships --------------->');
console.log('<---------------------------------------------->');
TOKENS.forEach( (tk) => {
  console.log( tk['lemma'] + ' --> ' + tk['parent'] + '\n');
});

//Print all children
console.log('<---------------------------------------------->');
console.log('<--------- Child Relationships ---------------->');
console.log('<---------------------------------------------->');
TOKENS.forEach( (tk) => {
  console.log( tk['lemma'] + ' <-- ' + tk['children'] + '\n');
});
console.log('<--------------------------------------------->');

//Process dates
//Find date matches
var date3digitregex = /(\d+\s*[-./]{1}\s*\d+\s*[-./]{1}\s*\d+)/g;
var date2digitregex = /(\d+\s*[-./]{1}\s*\d+)/g;

var datepositions = [];
var dates=[];
var dateposnlength = [];
function updateDateposition() {
  var posn = arguments[2];
  var match = arguments[1];
  //posn has not already been matched
  if ( _.indexOf(datepositions,posn) == -1 ) {
    datepositions.push(posn);
    dates.push(match);
    dateposnlength.push( [posn,match.length] );
  }
}

//Search for more specific 3 digit date pattern first
nlpraw.raw.replace( date3digitregex , updateDateposition);
nlpraw.raw.replace( date2digitregex , updateDateposition);

console.log('datepositions :' + datepositions);

var datetokens = [];
datepositions.forEach( (posn) => {
  datetokens.push( _.find(TOKENS,{'posn':posn}));
});
console.log(datetokens);
console.log(dates);

var departdate = [];
var returndate = [];
var dateidx;
datetokens.forEach( (tk,idx) => {
  findDatesRoot(tk,dates[idx]);
});

function findDatesRoot(tk,date) {
  if (tk['parent'] == undefined) {
      console.log('findDatesRoot no match found');
      return 1;
  }
  //console.log('findRoot: ' + tk['lemma'].indexOf(tk['parent']));
  if(tk['lemma'].indexOf(tk['parent']) != -1) {
  //if ( tk['lemma]'] == tk['parent'] ) { //doesn't work
    console.log('findDatesRoot no match found');
    return 1;
  }
  else {
    var isdep = _.indexOf(datekeys.depart, tk['parent'])
    if (isdep != -1) {
      departdate.push(date);
      return 1;
    }
    var isret = _.indexOf(datekeys.return, tk['parent'])
    if (isret != -1) {
      returndate.push(date);
      return 1 ;
    }

    if (isdep == -1 && isret == -1) findDatesRoot(TOKENS[tk['pidx']],date);
  }//else
}

console.log('numposn list (before prune) :' + numposnlist);

numposnlist = _.reject(numposnlist, (num) => {return posnWithinRange(num);} );

//Returns 1 if posn is within range
function posnWithinRange( posn ) {
    var rval = 0;
    dateposnlength.forEach( (entry) => {
      if ( posn >= entry[0] && (posn <= (entry[0]+entry[1])) ) {
        //console.log('posn:' + posn + ' within range');
        rval = 1;
      }
    });
    return rval ;
}
console.log('numposn list (after prune) :' + numposnlist);
console.log('dateposnlength :' + JSON.stringify(dateposnlength));

var duration = -1;
var quantity = -1;

//Process remaining Numbers
numposnlist.forEach( (posn) => {
  var rval;
  var tk = _.where(TOKENS,{'posn':posn})[0];
  console.log('num :' + tk['lemma']);

  //Process date of the form july 1st or 1st july
  //the 2 letters 'st', 'th' are removed during preprocessing
  //else it is recognized as a noun and not a number
  //Does not handle 1st OF july, see next section below
  findRootMonth(tk);

});

//To process dates of the form 1st of july
//Search for month name among nouns
nouns.forEach( (noun) => {
  var idx = _.indexOf(monthkeys,noun['lemma']);
  if (idx != -1) {
    var month = monthidx[idx];
    var tk = noun;
    var date = month + '/' ;
    var rval = findRootNum(tk,date);
    if (rval[0] != -1) {
      date = rval[1];
      findDatesRoot(rval[2],date);
    }
  }
})

//Process remaining Numbers
numposnlist.forEach( (posn) => {
  var rval;
  var tk = _.where(TOKENS,{'posn':posn})[0];
  console.log('num :' + tk['lemma']);

  //Match above failed, try to see if number refers to
  //the duration of the trip.
  if (duration == -1 )
      duration = findRoot(tk,durationkeys);

  //Above 2 matches failed, see if we can relate the number
  //to the number of people on the trip, number of tickets etc
  if (duration == -1) {
    if (quantity == -1)
      quantity = findRoot(tk,quantitykeys);
  }
});

RESULT['depart'] = departdate;
RESULT['return'] = returndate;
RESULT['duration'] = duration;
RESULT['quantity'] = quantity;

console.log(">-------------------------<");
console.log(">---------Input-----------<");
console.log(">-------------------------<");
console.log(nlpraw.raw);
console.log(">-------------------------<");
console.log(">---------Result----------<");
console.log(">-------------------------<");
console.log(RESULT);
console.log(">-------------------------<");

//------------------------------------------------------------------------------
//------------------------ Functions -------------------------------------------
//------------------------------------------------------------------------------
//Match up numbers to other keywords
function findRoot(tk,keys) {
  if (tk['parent'] == undefined) {
    console.log('findRoot no match found');
    return [-1];
  }
  else {
    //console.log('findRoot: ' + tk['lemma'].indexOf(tk['parent']));
    if(tk['lemma'].indexOf(tk['parent']) != -1) {
    //if ( tk['lemma]'] == tk['parent'] ) { //doesn't work
      console.log('findRoot no match found');
      return -1;
    }
    else {
      console.log(tk['lemma'] + '--->' + tk['parent']);
      var rval = _.indexOf(keys, tk['parent']);
      console.log('rval :' + rval);
      if (rval != -1) {
        return tk['lemma'];
      }
      else {
        return findRoot(TOKENS[tk['pidx']],keys);
      }
    }
  }
}

//Process 1st of july , the 'of' throws the 1 july and july 1 stuff off
function findRootNum(tk,date) {
  if (tk['parent'] == undefined) {
    console.log('findRootNum no match found');
    return [-1];
  }
  else {
    //console.log('findRoot: ' + tk['lemma'].indexOf(tk['parent']));
    if(tk['lemma'].indexOf(tk['parent']) != -1) {
    //if ( tk['lemma]'] == tk['parent'] ) { //doesn't work
      console.log('findRootNum no match found');
      return [-1];
    }
    else {
      //See if parent is a number
      var mval = tk['parent'].match(/\b[0-9]+\b/);
      if ( mval == null ) {
        //No match, so go another level down
        return findRootNum(TOKENS[tk['pidx']],date);
      }
      else {
        date = date + tk['parent'];
        return [1,date,TOKENS[tk['pidx']]];
      }
    }
  }
}

function findRootMonth(tk) {
  if (tk['parent'] == undefined) {
    console.log('findRootMonth no match found');
    return [-1];
  }
  else {
    //console.log('findRoot: ' + tk['lemma'].indexOf(tk['parent']));
    if(tk['lemma'].indexOf(tk['parent']) != -1) {
    //if ( tk['lemma]'] == tk['parent'] ) { //doesn't work
      console.log('findRoot no match found');
      return -1;
    }
    else {
      var idx = _.indexOf(monthkeys,tk['parent']);
      //Process date of the form 1 july or july 1
      if (idx != -1) {
        var month = monthidx[idx];
        var date = month + '/' + tk['lemma']  ;
        findDatesRoot( TOKENS[tk['pidx']] , date);
        return 1;
      }
    }//else
  }
}

function arrayFind ( array, item ) {
  return _.indexOf(array,item) != -1 ;
}
