
var ccxt = require ('ccxt');

const exchange = new ccxt.binance();

var ts = Math.round(new Date().getTime() );
var tsYesterday = ts - (24 * 3600*1000);

//fetch average amplitude (in %) and volume with given set of ohlcv
//also get the max amplitude (just see if their was major bull run which might have caused the average increase in amplitude percentage)
function getAmplitudeAndVolume(ohlcv){
    var amp_percent_sum =0;
    var volSum=0;
    var max_amp_percent=0
    for(i in ohlcv){
        let [time , open_val ,high , low, close_val ,vol] = ohlcv[i];

        // time ,open ,high ,low , close ,volume
        amp_percent = (((high-low)/low)*100);
        max_amp_percent = max_amp_percent> amp_percent ? max_amp_percent : amp_percent;
        amp_percent_sum += amp_percent  ;
        volSum += vol ;
    }
    return{
        vol :volSum/ohlcv.length,
        amp_percent : amp_percent_sum/ohlcv.length,
        max_amp_percent : max_amp_percent
    }
}



async function getTopVolatileCoinsinUSDT(){
    let arr=[];
    let max_amp=0;
    let max_amp_symb = '';
    let sleep = (ms) => new Promise (resolve => setTimeout (resolve, ms));
    if (exchange.has.fetchOHLCV) {
      const markets = await exchange.fetchMarkets()
       
      let complete_percent = 0;
      for (index in markets) {
            
            let symbol= markets[index].symbol;
            if(!symbol.endsWith("USDT"))
                continue;

            await sleep (exchange.rateLimit) // milliseconds    
            exchange.fetchOHLCV (markets[index].symbol, '15m',tsYesterday).then(ohlcv=>{
                let {vol , amp_percent,max_amp_percent} = getAmplitudeAndVolume(ohlcv);
                arr.push({symbol , vol,amp_percent,max_amp_percent});
                if (max_amp < amp_percent){
                    max_amp=amp_percent;
                    max_amp_symb = symbol; 
                }  
            })
           console.log( "complete......"+ index + " out of " + markets.length );
        }
        arr.sort(compare)
       
        console.log(max_amp_symb + " : "+max_amp);

        for (i=1,c=1 ; c<=10 ; i++){
            if(arr[i-1].amp_percent >2)
                continue;

            console.log("Rank "+c+ ": " +JSON.stringify(arr[i-1]));
            c++;
        }
        
    }
}

//comparator to sort the coins in descending order
function compare(a,b){
    if(a.amp_percent < b.amp_percent)
        return 1;
    if(a.amp_percent > b.amp_percent)
        return -1;    
    return 0;    
}

try{
    getTopVolatileCoinsinUSDT();
   
}catch (e){
    
    console.log(e);
}

