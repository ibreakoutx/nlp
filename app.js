var fs = require('fs');
var Q = require('q');

// print process.argv
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});

var nlpReq = {
  "document":{
      "type":"PLAIN_TEXT",
      "content":""
  },
  "encodingType":"UTF8"
};

var readFileAsync = Q.nfbind(fs.readFile);
var writeFileAsync = Q.nfbind(fs.writeFile);
var nlpraw = {} ;

readFileAsync(process.argv[2],'utf-8')
.then( data => {
  data = preprocess(data);
  nlpraw['raw']=  data ;
  nlpReq["document"]["content"] = data ;
  return writeFileAsync("./request.json" , JSON.stringify(nlpReq,null,4));
})
.then( () => {
  return writeFileAsync("./nlpraw.json" ,JSON.stringify(nlpraw,null,4));
})
.then( () => {
  console.log("request json file created") ;
  process.exit(0);
})
.catch( err => {console.log(err);
process.exit(1);
})

//Preprocess data
function preprocess(text) {
  //Date preprocess #1
  //Convert dates from 4-1-2017 to 4/1/2017
  //other separators are 4.1.2017
  //spaces for eg: 4 - 1 - 2017 , 4 . 1 . 2017 or 4 / 1 / 2017
  //3 digit date
  text = text.replace(/(\d+)\s*[-./]{1}\s*(\d+)\s*[-./]{1}\s*(\d+)/g,"$1/$2/$3");
  //2 digit date
  text = text.replace(/(\d+)\s*[-./]{1}\s*(\d+)/g,"$1/$2");

  //Date preprocess #2
  //Replace 4th of july with 4 of july , july 4th with july 4
  text = text.replace(/(\d+)\s*[A-Za-z]{2}\b/g,"$1 ");
  text = text.toLowerCase();

  return text;
}
