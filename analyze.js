var _ = require('underscore');
var nlpraw = require("./nlpraw.json");
var entity = require("./entity.json");
var syntax = require("./syntax.json");

//Result dictionary
var RESULT = {};

//Word keys
//------------------------------------------------------------------------------
var destinationkeys = ['to','for'];
var originkeys = ['from'];
var datekeys = {
  'depart': ['depart','leave','fly','fly out','go','go out','step out','start',
              'start out','get away','go away','hit the road','arrive', 'travel',
              'vacation'
               ],
  'return':['return','come', 'come back', 'be','be back','back','reenter']
};

var monthkeys = [ 'jan' , 'january' , 'feb', 'february', 'mar', 'march',
  'apr','april','may','jun','june','july','jul','aug','august','sep',
  'september','oct','october','nov','november','dec','december'
];
//month idx corresponding to monthkeys entries above
var monthidx = [ 1 , 1 , 2, 2, 3, 3,
   4 , 4 , 5 , 6 , 6 , 7 , 7 , 8 , 8 , 9 ,
   9 , 10 , 10 , 11 , 11 , 12 , 12
];

var quantitykeys = ['buy','ticket','person'];
var durationkeys = ['night','day','week','month','year','fortnight'];
//------------------------------------------------------------------------------

var entitylist = entity['entities'];
console.log('ENTITIES :' + _.pluck(entitylist, 'name'));

var locations = _.where(entitylist, {'type':'LOCATION'});
console.log('LOCATIONS :' + JSON.stringify(locations));

var tokenlist = syntax['tokens'];

//Flatten structure for easier data retrievel
//Move up some of these f**** nested properties
//so underscore has an easier time
tokenlist.forEach( (tk,idx) => {
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

tokenlist.forEach( (tk) => {
  //parent word
  tk['parent'] = tokenlist[tk['pidx']]['lemma'];
});

//Find all children
tokenlist.forEach( (p) => {
  var children = [];
  var childrenidx = [];
  var childrenposn = [];

  var name = p['lemma'];
  tokenlist.forEach( (c,i) => {
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

//Find nouns
var nouns = _.where(tokenlist, {'tag':'NOUN'});
console.log( 'NOUNS :' + _.pluck(nouns,'lemma'));

//Find numbers
var nums = _.where(tokenlist,{'tag':'NUM'});
//List of number positions
var numposnlist = _.pluck(nums,'posn');

console.log( 'Numbers :' + _.pluck(nums,'lemma'));

var locationNames = _.pluck(locations,'name');

locations.forEach( (loc) => {
  console.log('loc[name] :' + loc['name']);
  var parentofloc = getLocationParent(loc['name']);
  console.log( "Locations :" + loc['name'] + ' : ' + parentofloc ) ;

  //Store result of determining from and to locations
  if ( arrayFind(destinationkeys, parentofloc) ) RESULT['to'] = loc['name'];
  if ( arrayFind(originkeys, parentofloc) ) RESULT['from'] = loc['name'];
});

function getLocationParent(name) {
    var tk = _.find(tokenlist,(t) => { return t['lemma'] == name ;});
    //return tokenlist[tk['pidx']]['word'] ;
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
tokenlist.forEach( (tk) => {
  console.log( tk['lemma'] + ' --> ' + tk['parent'] + '\n');
});

//Print all children
console.log('<---------------------------------------------->');
console.log('<--------- Child Relationships ---------------->');
console.log('<---------------------------------------------->');
tokenlist.forEach( (tk) => {
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
  datetokens.push( _.find(tokenlist,{'posn':posn}));
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

    if (isdep == -1 && isret == -1) findDatesRoot(tokenlist[tk['pidx']],date);
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
  var tk = _.where(tokenlist,{'posn':posn})[0];
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
  var tk = _.where(tokenlist,{'posn':posn})[0];
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
      return findRoot(tokenlist[tk['pidx']],keys);
    }
  }
}

//Process 1st of july , the 'of' throws the 1 july and july 1 stuff off
function findRootNum(tk,date) {
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
      return findRootNum(tokenlist[tk['pidx']],date);
    }
    else {
      date = date + tk['parent'];
      return [1,date,tokenlist[tk['pidx']]];
    }
  }//else
}

function findRootMonth(tk) {
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
      findDatesRoot( tokenlist[tk['pidx']] , date);
      return 1;
    }
  }//else
}

function arrayFind( array, item ) {
  return _.indexOf(array,item) != -1 ;
}