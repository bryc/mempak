(function () {
/* ---- */
function MemPak()
{
    function init()
    {
        var i, data = new Uint8Array(32768);
        function A(a) {for(i=0;i<7;++i) {data[a+i]=[1,1,0,1,1,254,241][i];}}
        A(57);A(121);A(153);A(217);
        for(i=4;i<128;i++) {data[256+i*2+1]=3;data[512+i*2+1]=3;}
        data[257]=113;data[513]=113;
        ref.data = data;
        ref.filename = "MemPak.mpk";
    }
    function parse(data, filename)
    {
        function addError(errorName)
        {
            if(errorReport[errorName] === undefined)
            {
                errorReport[errorName] = 1;
            } else { errorReport[errorName]++; }
        }
        var i, p, p2, a, b, c, indexes = [], seq, out, errorReport = {};
        function checkIndexes(o)
        {
            var Output = {}, found = {keys: [], values: []}, ends = 0, usedPages = 0, count = 0;
            errorReport = {};
            for(i = o + 0xA; i < o + 0x100; i += 2)
            {
                p  = data[i + 1]; p2 = data[i];
                if(p2 === 0 && p === 1 || p !== 3 && p >= 5 && p <= 127)
                {
                    if(p===1){ends += 1;}
                    usedPages+=1;
                    found.keys.push((i - o) / 2);
                    if (p !== 1 && found.values.indexOf(p) !== -1) {
                        // If index used more than once, return false
                        addError("DuplicateIndex");
                        //return false;
                    }
                    found.values.push(p);
                } else if(p2 !== 0 || p !== 1 && p !== 3 && p < 5 || p > 127)
                { 
                    // If index value is unexpected, return false
                    addError("InvalidIndex");
                    //return false;
                } 
            }
            if (indexes.length !== ends) {
                // The amount of 0x01 values doesn't match noteTable
                addError("Mismatch_SequenceTerminator");
                //return false;
            }
            found.indexes = found.keys.filter(function(n)
            {
                return found.values.indexOf(n) === -1;
            });
            if (indexes.length !== found.indexes.length) {
                // If different number of key indexes are compared, false
                addError("Mismatch_KeyIndexCount");
                //return false;
            }
            for (i = 0; i < indexes.length; i++) {
                if (indexes.indexOf(found.indexes[i]) === -1) {
                    // If key index does not exist in other list, false
                    addError("Mismatch_KeyIndex");
                    //return false;
                }
            }

            for(i = 0; i < found.indexes.length; i++)
            {
                seq = []; p = found.indexes[i];
                while(p === 1 || p >= 5 && p <= 127)
                {    
                    if(seq.indexOf(p) !== -1)
                    {
                        // If parser encounters an index already used
                        addError("InfiniteLoopInSequence");
                        break;
                    }

                    if(p === 1){Output[found.indexes[i]] = seq;break;}
                    count+=1;
                    seq.push(p);
                    p = data[(p * 2) + o + 1];
                    
                }
            }

            if(count !== usedPages) {
                // Ensure that all non-free indexes are used
                addError("Mismatch_FoundIndexes");
                //return false;
            }
            
            if(Object.keys(errorReport).length === 0) {
                //ref.filename = filename;
                return Output;
            } else { console.log(filename, errorReport, Output); return false; }
        }



        // 1. NoteTable keys
        for(i = 0x300; i < 0x500; i += 32)
        {
            p = data[i + 0x07]; a = data[i + 0x06];
            b = data[i + 0x0A]; c = data[i + 0x0B];
    
            if(p>=5 && p<=127 && a===0 && b===0 && c===0)
            {
                indexes.push(p);
            }
        }
         
        out = checkIndexes(0x100) || checkIndexes(0x200);
        if(out !== false) { ref.MemPak = {
           Indexes: out 
        };} else {
            console.error("ERROR: Corrupt file - %s", filename);
        }
    }


    var ref   = this;
    ref.init  = init;
    ref.parse = parse; 
};
 
var T = new MemPak();
//T.init();
//T.parse();
//console.log(T); 

////////////////////////////////////////////////////////////
window.addEventListener("drop", function(event)
{
    var i, files = event.dataTransfer.files, reader;
    
    for(i = 0; i < files.length; i++)
    {
        reader        = new FileReader();
        reader.name   = files[i].name;
        reader.onload = function(event)
        {
            var data = new Uint8Array(event.target.result);
            if(String.fromCharCode.apply(null, data.subarray(0, 11)) === "123-456-STD") {
                data = data.subarray(0x1040);
            }
            T.parse(data, event.target.name);
            //console.log(T.MemPak);
        };
        reader.readAsArrayBuffer(files[i].slice(0, 36928));
    }
    event.preventDefault();
});
window.addEventListener("dragover",function(event){event.preventDefault();});
/* ---- */
}());
