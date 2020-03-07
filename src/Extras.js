// here lies a couple of wrappers for applying operations on an array
const arrMax = arr => Math.max(...arr);
const arrMin = arr => Math.min(...arr);
const arrSum = arr => arr.reduce((a, b) => a + b, 0);
const arrAvg = arr => arrSum(arr) / arr.length;
const arrStd = arr => Math.sqrt(arrAvg(arr.map(v => Math.pow(v - arrAvg(arr), 2))));
const normalize = (min, max) => uV => (uV - min) / (max - min);
const padHex = hexString => `${"0".repeat(6 - hexString.length)}${hexString}`;
const toHex = v => {
    // commented-out lines are for generating a greyscale image
    let pre_hex = Math.floor((Math.pow(256, 3) - 1) * v);
    // let pre_hex = Math.floor((Math.pow(256, 1) - 1) * v);
    let hexString = pre_hex.toString(16);
    return padHex(hexString);
    // return `${hexString}${hexString}${hexString}`
};

// Apply a filter to a set given the co-eff's
const filterIIR = (filt_b, filt_a, data) => {
    let Nback = filt_b.length;
    let prev_y = new Array(Nback);
    let prev_x = new Array(Nback);
    for (let i = 0; i < data.length; i++) {
        for (let j = Nback - 1; j > 0; j--) {
            prev_y[j] = prev_y[j - 1];
            prev_x[j] = prev_x[j - 1];
        }
        prev_x[0] = data[i];
        let out = 0;
        for (let j = 0; j < Nback; j++) {
            out += filt_b[j] * prev_x[j];
            if (j > 0) {
                out -= filt_a[j] * prev_y[j];
            }
        }
        prev_y[0] = out;
        data[i] = out;
    }
    return data;
};

class RunningMean {
    constructor(N) {
        this.values = new Array(N);
        this.currentIndex = 0;
    }

    addValue(val) {
        this.values[this.currentIndex] = val;
        this.currentIndex = (this.currentIndex + 1) % this.values.length;
    }

    calcMean() {
        return arrAvg(this.values);
    }
}

const getSampleRateSafe = () => 250; // Known rate for cyton over serial

const getNfftSafe = () => {
    let sampleRate = getSampleRateSafe();
    switch (sampleRate) {
        case 1000:
            return 1024;
        case 1600:
            return 2048;
        case 125:
        case 200:
        case 250:
        default:
            return 256;
    }
};

class FilterConstants {
    constructor(b_given, a_given, name_given, short_name_given) {
        this.a = [];
        this.b = [];
        for (let i = 0; i < this.b.length; i++) {
            this.b[i] = b_given[i];
        }
        for (let i = 0; i < this.a.length; i++) {
            this.a[i] = a_given[i];
        }
        // this is ignored in the interface... for now
        this.name_given = name_given;
        this.short_name_given = short_name_given;
    }
}

class DataProcessing {
    // Class from the official OpenBCI GUI for applying filters to the data...
    // this will be moved to use the fili npm package for coeff generation and
    // the actual application of the filters.
    constructor(NCHAN, sample_rate_Hz) {
        this.N_FILT_CONFIGS = 5;
        this.filtCoeff_bp = new Array(this.N_FILT_CONFIGS);
        this.N_NOTCH_CONFIGS = 3;
        this.filtCoeff_notch = new Array(this.N_NOTCH_CONFIGS);
        this.currentFilt_ind = 3; // Current Bandpass filter is 5-50Hz
        this.currentNotch_ind = 0; // current notch filter is 60Hz as 2nd order Butterworth
        this.processing_band_low_Hz = [1, 4, 8, 13, 30];
        this.processing_band_high_Hz = [4, 8, 13, 30, 55];
        this.nchan = NCHAN;
        this.fs_Hz = sample_rate_Hz;
        this.data_std_uV = new Array(this.nchan);
        this.polarity = new Array(this.nchan);
        this.newDataToSend = false;
        this.avgPowerInBins = new Array(this.nchan).fill(new Array(this.processing_band_low_Hz.length))
        this.headWidePower = new Array(this.processing_band_low_Hz.length);
        this.defineFilters();
    }

    // prepare all of the coeff for the data
    defineFilters() {
        let n_filt; // int
        let b, a, b2, a2; // Arrays
        n_filt = this.filtCoeff_notch.length;
        for (let Ifilt = 0; Ifilt < n_filt; Ifilt++) {
            switch (Ifilt) {
                case 0:
                    //60 Hz notch filter, 2nd Order Butterworth: [b, a] = butter(2,[59.0 61.0]/(fs_Hz / 2.0), 'stop') %matlab command
                    switch (this.fs_Hz) {
                        case 125:
                            b2 = [0.931378858122982, 3.70081291785747, 5.53903191270520, 3.70081291785747, 0.931378858122982];
                            a2 = [1, 3.83246204081167, 5.53431749515949, 3.56916379490328, 0.867472133791669];
                            break;
                        case 200:
                            b2 = [0.956543225556877, 1.18293615779028, 2.27881429174348, 1.18293615779028, 0.956543225556877];
                            a2 = [1, 1.20922304075909, 2.27692490805580, 1.15664927482146, 0.914975834801436];
                            break;
                        case 250:
                            b2 = [0.965080986344733, -0.242468320175764, 1.94539149412878, -0.242468320175764, 0.965080986344733];
                            a2 = [1, -0.246778261129785, 1.94417178469135, -0.238158379221743, 0.931381682126902];
                            break;
                        case 500:
                            b2 = [0.982385438526095, -2.86473884662109, 4.05324051877773, -2.86473884662109, 0.982385438526095];
                            a2 = [1, -2.89019558531207, 4.05293022193077, -2.83928210793009, 0.965081173899134];
                            break;
                        case 1000:
                            b2 = [0.991153595101611, -3.68627799048791, 5.40978944177152, -3.68627799048791, 0.991153595101611];
                            a2 = [1, -3.70265590760266, 5.40971118136100, -3.66990007337352, 0.982385450614122];
                            break;
                        case 1600:
                            b2 = [0.994461788958027, -3.86796874670208, 5.75004904085114, -3.86796874670208, 0.994461788958027];
                            a2 = [1, -3.87870938463296, 5.75001836883538, -3.85722810877252, 0.988954249933128];
                            break;
                        default:
                            b2 = [1.0];
                            a2 = [1.0];
                    }
                    this.filtCoeff_notch[Ifilt] = new FilterConstants(b2, a2, "Notch 60Hz", "60Hz");
                    break;
                case 1:
                    //50 Hz notch filter, 2nd Order Butterworth: [b, a] = butter(2,[49.0 51.0]/(fs_Hz / 2.0), 'stop')
                    switch (this.fs_Hz) {
                        case 125:
                            b2 = [0.931378858122983, 3.01781693143160, 4.30731047590091, 3.01781693143160, 0.931378858122983];
                            a2 = [1, 3.12516981877757, 4.30259605835520, 2.91046404408562, 0.867472133791670];
                            break;
                        case 200:
                            b2 = [0.956543225556877, -2.34285519884863e-16, 1.91308645111375, -2.34285519884863e-16, 0.956543225556877];
                            a2 = [1, -1.41553435639707e-15, 1.91119706742607, -1.36696209906972e-15, 0.914975834801435];
                            break;
                        case 250:
                            b2 = [0.965080986344734, -1.19328255433335, 2.29902305135123, -1.19328255433335, 0.965080986344734];
                            a2 = [1, -1.21449347931898, 2.29780334191380, -1.17207162934771, 0.931381682126901];
                            break;
                        case 500:
                            b2 = [0.982385438526090, -3.17931708468811, 4.53709552901242, -3.17931708468811, 0.982385438526090];
                            a2 = [1, -3.20756923909868, 4.53678523216547, -3.15106493027754, 0.965081173899133];
                            break;
                        case 1000:
                            b2 = [0.991153595101607, -3.77064677042206, 5.56847615976560, -3.77064677042206, 0.991153595101607];
                            a2 = [1, -3.78739953308251, 5.56839789935513, -3.75389400776205, 0.982385450614127];
                            break;
                        case 1600:
                            b2 = [0.994461788958316, -3.90144402068168, 5.81543195046478, -3.90144402068168, 0.994461788958316];
                            a2 = [1, -3.91227761329151, 5.81540127844733, -3.89061042807090, 0.988954249933127];
                            break;
                        default:
                            b2 = [1.0];
                            a2 = [1.0];
                    }
                    this.filtCoeff_notch[Ifilt] = new FilterConstants(b2, a2, "Notch 50Hz", "50Hz");
                    break;
                case 2:
                    //no notch filter
                    b2 = [1.0];
                    a2 = [1.0];
                    this.filtCoeff_notch[Ifilt] = new FilterConstants(b2, a2, "No Notch", "None");
                    break;
            }
        }

        n_filt = this.filtCoeff_bp.length;
        for (let Ifilt = 0; Ifilt < n_filt; Ifilt++) {
            let filt_txt = "";
            let short_txt = "";
            switch (Ifilt) {
                case 0:
                    switch (this.fs_Hz) {
                        case 125:
                            b = [0.615877232553135, 0, -1.23175446510627, 0, 0.615877232553135];
                            a = [1, -0.789307541613509, -0.853263915766877, 0.263710995896442, 0.385190413112446];
                            break;
                        case 200:
                            b = [0.283751216219319, 0, -0.567502432438638, 0, 0.283751216219319];
                            a = [1, -1.97380379923172, 1.17181238127012, -0.368664525962831, 0.171812381270120];
                            break;
                        case 250:
                            b = [0.200138725658073, 0, -0.400277451316145, 0, 0.200138725658073];
                            a = [1, -2.35593463113158, 1.94125708865521, -0.784706375533419, 0.199907605296834];
                            break;
                        case 500:
                            b = [0.0652016551604422, 0, -0.130403310320884, 0, 0.0652016551604422];
                            a = [1, -3.14636562553919, 3.71754597063790, -1.99118301927812, 0.420045500522989];
                            break;
                        case 1000:
                            b = [0.0193615659240911, 0, -0.0387231318481823, 0, 0.0193615659240911];
                            a = [1, -3.56607203834158, 4.77991824545949, -2.86091191298975, 0.647068888346475];
                            break;
                        case 1600:
                            b = [0.00812885687466408, 0, -0.0162577137493282, 0, 0.00812885687466408];
                            a = [1, -3.72780746887970, 5.21756471024747, -3.25152171857009, 0.761764999239264];
                            break;
                        default:
                            b = [1.0];
                            a = [1.0];
                    }
                    filt_txt = "Bandpass 1-50Hz";
                    short_txt = "1-50 Hz";
                    break;
                case 1:
                    switch (this.fs_Hz) {
                        case 125:
                            b = [0.0186503962278349, 0, -0.0373007924556699, 0, 0.0186503962278349];
                            a = [1, -3.17162467236842, 4.11670870329067, -2.55619949640702, 0.652837763407545];
                            break;
                        case 200:
                            b = [0.00782020803349772, 0, -0.0156404160669954, 0, 0.00782020803349772];
                            a = [1, -3.56776916484310, 4.92946172209398, -3.12070317627516, 0.766006600943265];
                            break;
                        case 250:
                            b = [0.00512926836610803, 0, -0.0102585367322161, 0, 0.00512926836610803];
                            a = [1, -3.67889546976404, 5.17970041352212, -3.30580189001670, 0.807949591420914];
                            break;
                        case 500:
                            b = [0.00134871194834618, 0, -0.00269742389669237, 0, 0.00134871194834618];
                            a = [1, -3.86550956895320, 5.63152598761351, -3.66467991638185, 0.898858994155253];
                            break;
                        case 1000:
                            b = [0.000346041337684191, 0, -0.000692082675368382, 0, 0.000346041337684191];
                            a = [1, -3.93960949694447, 5.82749974685320, -3.83595939375067, 0.948081706106736];
                            break;
                        case 1600:
                            b = [0.000136510722194708, 0, -0.000273021444389417, 0, 0.000136510722194708];
                            a = [1, -3.96389829181139, 5.89507193593518, -3.89839913574117, 0.967227428151860];
                            break;
                        default:
                            b = [1.0];
                            a = [1.0];
                    }
                    filt_txt = "Bandpass 7-13Hz";
                    short_txt = "7-13 Hz";
                    break;
                case 2 :
                    switch (this.fs_Hz) {
                        case 125:
                            b = [0.350346377855414, 0, -0.700692755710828, 0, 0.350346377855414];
                            a = [1, 0.175228265043619, -0.211846955102387, 0.0137230352398757, 0.180232073898346];
                            break;
                        case 200:
                            b = [0.167483800127017, 0, -0.334967600254034, 0, 0.167483800127017];
                            a = [1, -1.56695061045088, 1.22696619781982, -0.619519163981229, 0.226966197819818];
                            break;
                        case 250:
                            b = [0.117351036724609, 0, -0.234702073449219, 0, 0.117351036724609];
                            a = [1, -2.13743018017206, 2.03857800810852, -1.07014439920093, 0.294636527587914];
                            break;
                        case 500:
                            b = [0.0365748358439273, 0, -0.0731496716878546, 0, 0.0365748358439273];
                            a = [1, -3.18880661866679, 3.98037203788323, -2.31835989524663, 0.537194624801103];
                            break;
                        case 1000:
                            b = [0.0104324133710872, 0, -0.0208648267421744, 0, 0.0104324133710872];
                            a = [1, -3.63626742713985, 5.01393973667604, -3.10964559897057, 0.732726030371817];
                            break;
                        case 1600:
                            b = [0.00429884732196394, 0, -0.00859769464392787, 0, 0.00429884732196394];
                            a = [1, -3.78412985599134, 5.39377521548486, -3.43287342581222, 0.823349595537562];
                            break;
                        default:
                            b = [1.0];
                            a = [1.0];
                    }
                    filt_txt = "Bandpass 15-50Hz";
                    short_txt = "15-50 Hz";
                    break;
                case 3:
                    switch (this.fs_Hz) {
                        case 125:
                            b = [0.529967227069348, 0, -1.05993445413870, 0, 0.529967227069348];
                            a = [1, -0.517003774490767, -0.734318454224823, 0.103843398397761, 0.294636527587914];
                            break;
                        case 200:
                            b = [0.248341078962541, 0, -0.496682157925081, 0, 0.248341078962541];
                            a = [1, -1.86549482213123, 1.17757811892770, -0.460665534278457, 0.177578118927698];
                            break;
                        case 250:
                            b = [0.175087643672101, 0, -0.350175287344202, 0, 0.175087643672101];
                            a = [1, -2.29905535603850, 1.96749775998445, -0.874805556449481, 0.219653983913695];
                            break;
                        case 500:
                            b = [0.0564484622607352, 0, -0.112896924521470, 0, 0.0564484622607352];
                            a = [1, -3.15946330211917, 3.79268442285094, -2.08257331718360, 0.450445430056042];
                            break;
                        case 1000:
                            b = [0.0165819316692804, 0, -0.0331638633385608, 0, 0.0165819316692804];
                            a = [1, -3.58623980811691, 4.84628980428803, -2.93042721682014, 0.670457905953175];
                            break;
                        case 1600:
                            b = [0.00692579317243661, 0, -0.0138515863448732, 0, 0.00692579317243661];
                            a = [1, -3.74392328264678, 5.26758817627966, -3.30252568902969, 0.778873972655117];
                            break;
                        default:
                            b = [1.0];
                            a = [1.0];
                    }
                    filt_txt = "Bandpass 5-50Hz";
                    short_txt = "5-50 Hz";
                    break;
                default:
                    b = [1.0];
                    a = [1.0];
                    filt_txt = "No BP Filter";
                    short_txt = "No Filter";
                    break;
            }
            this.filtCoeff_bp = new FilterConstants(b, a, filt_txt, short_txt);
        }
    }

    // actually apply the filter to a data set
    process(data_forDisplay_uV) {
        for (let Ichan = 0; Ichan < this.nchan; Ichan++) {
            data_forDisplay_uV[Ichan] = filterIIR(this.filtCoeff_notch[this.currentNotch_ind].b, this.filtCoeff_notch[this.currentNotch_ind].a, data_forDisplay_uV[Ichan]);
            data_forDisplay_uV[Ichan] = filterIIR(this.filtCoeff_bp[this.currentFilt_ind].b, this.filtCoeff_bp[this.currentFilt_ind].a, data_forDisplay_uV[Ichan]);
        }
        return data_forDisplay_uV;
    }
}

module.exports = {
    padHex,
    arrMax,
    arrMin,
    arrSum,
    arrAvg,
    arrStd,
    normalize,
    filterIIR,
    toHex,
    RunningMean,
    DataProcessing
};
