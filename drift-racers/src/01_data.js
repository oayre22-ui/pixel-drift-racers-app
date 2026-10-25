'use strict';
// ===== Pixel Drift Racers: data =====
const PPM = 4;            // world pixels per metre
const G = 9.81;
const ROAD_W = 60;        // px
const RUNOFF = 30;        // px of gravel either side of the road
const CURB = 4;

// ---- Cars (fictional) ----
// power kW, mass kg, len/wid in sprite px, a/b metres CG->axle, grip base
const CARS = [
  {id:'hachi', name:'Hachi AE', price:0, style:'coupe', len:16, wid:8, power:95, mass:950, a:1.15, b:1.25, h:0.48, grip:1.0,
   redline:7600, gears:[3.59,2.02,1.38,1.0,0.86], final:4.3, wheelR:0.29, steer:36, drag:0.40, color:'#f4f1ff', tier:1,
   blurb:'Light, balanced, rear drive. The classic first drift car.'},
  {id:'kei', name:'Kei Sprite', price:3500, style:'kei', len:13, wid:7, power:52, mass:700, a:1.0, b:1.05, h:0.5, grip:0.98,
   redline:9000, gears:[3.8,2.3,1.6,1.2,0.95], final:4.6, wheelR:0.27, steer:38, drag:0.36, color:'#ffd23d', tier:1,
   blurb:'Tiny, twitchy and loud. Mid-engine kei with a screaming redline.'},
  {id:'strada', name:'Strada S', price:9500, style:'coupe', len:17, wid:8, power:150, mass:1220, a:1.2, b:1.3, h:0.5, grip:1.02,
   redline:7200, gears:[3.32,1.9,1.31,1.0,0.8], final:4.1, wheelR:0.31, steer:38, drag:0.42, color:'#ff3d7f', tier:2,
   blurb:'Turbo four-pot coupe. The drift scene favourite.'},
  {id:'ronin', name:'Ronin RX', price:16000, style:'fastback', len:17, wid:8, power:178, mass:1260, a:1.18, b:1.27, h:0.46, grip:1.05,
   redline:9200, gears:[3.48,2.02,1.39,1.0,0.76], final:4.1, wheelR:0.31, steer:37, drag:0.38, color:'#3df2ff', tier:2,
   blurb:'Rotary fastback. Revs forever, perfect 50/50 balance.'},
  {id:'bruiser', name:'Bruiser V8', price:29000, style:'muscle', len:19, wid:9, power:300, mass:1650, a:1.3, b:1.45, h:0.55, grip:1.0,
   redline:6600, gears:[2.66,1.78,1.3,1.0,0.74], final:3.7, wheelR:0.33, steer:34, drag:0.47, color:'#ff7b2d', tier:3,
   blurb:'Big-block muscle. Smokes the tyres in every gear.'},
  {id:'kaiju', name:'Kaiju GT', price:58000, style:'gt', len:18, wid:9, power:380, mass:1560, a:1.3, b:1.4, h:0.48, grip:1.1,
   redline:7800, gears:[3.0,2.0,1.45,1.12,0.9,0.75], final:3.8, wheelR:0.33, steer:35, drag:0.40, color:'#9a93c9', tier:3,
   blurb:'Twin-turbo straight six GT. Monster power, monster grip.'},
  {id:'phantom', name:'Phantom R', price:125000, style:'super', len:18, wid:9, power:520, mass:1420, a:1.45, b:1.25, h:0.42, grip:1.18,
   redline:8800, gears:[3.1,2.1,1.6,1.28,1.05,0.88], final:3.6, wheelR:0.34, steer:34, drag:0.36, color:'#5dff6a', tier:4,
   blurb:'Mid-engine hypercar. Only for the brave.'},
  {id:'van', name:'Postie Van', price:2500, style:'van', len:17, wid:9, power:70, mass:1350, a:1.25, b:1.3, h:0.7, grip:0.92,
   redline:6000, gears:[3.9,2.2,1.45,1.0,0.82], final:4.6, wheelR:0.3, steer:36, drag:0.55, color:'#c9c9d6', tier:1,
   blurb:'A rear-drive delivery van. Slow, tall, and hilarious sideways.'},
  {id:'mira', name:'Mira Roadster', price:6000, style:'roadster', len:15, wid:8, power:105, mass:980, a:1.1, b:1.15, h:0.44, grip:1.02,
   redline:7200, gears:[3.14,1.89,1.33,1.0,0.81], final:4.3, wheelR:0.29, steer:37, drag:0.40, color:'#ff3d3d', tier:1,
   blurb:'Little open-top roadster. Perfect balance, easy to learn on.'},
  {id:'hatch', name:'Hot Hatch R', price:7500, style:'hatch', len:15, wid:8, power:140, mass:1080, a:1.05, b:1.25, h:0.5, grip:1.02,
   redline:8200, gears:[3.23,2.11,1.46,1.03,0.79], final:4.4, wheelR:0.3, steer:36, drag:0.42, color:'#3d8bff', tier:2,
   blurb:'Rear-drive conversion hot hatch. Short wheelbase, very lively.'},
  {id:'estate', name:'Estate 325', price:8500, style:'wagon', len:18, wid:8, power:140, mass:1350, a:1.3, b:1.35, h:0.52, grip:1.0,
   redline:6800, gears:[3.83,2.2,1.4,1.0,0.81], final:3.9, wheelR:0.31, steer:36, drag:0.44, color:'#1fb36b', tier:2,
   blurb:'Long-roof Euro wagon. Smooth straight six, long lazy drifts.'},
  {id:'chase', name:'Chase Tourer', price:18000, style:'sedan', len:19, wid:9, power:210, mass:1460, a:1.35, b:1.4, h:0.52, grip:1.02,
   redline:7000, gears:[3.25,1.96,1.34,1.0,0.75], final:3.9, wheelR:0.32, steer:36, drag:0.43, color:'#1d1d27', tier:2,
   blurb:'Four-door turbo saloon. Takes four mates to the drift event.'},
  {id:'raiden', name:'Raiden GT-S', price:22000, style:'coupe', len:18, wid:9, power:205, mass:1340, a:1.25, b:1.35, h:0.48, grip:1.05,
   redline:7400, gears:[3.21,1.93,1.3,1.0,0.75], final:4.1, wheelR:0.32, steer:36, drag:0.40, color:'#2b3fd6', tier:2,
   blurb:'Rear-drive straight-six coupe. Tunes up beautifully.'},
  {id:'hauler', name:'Hauler Drift Truck', price:21000, style:'truck', len:20, wid:9, power:260, mass:1750, a:1.5, b:1.6, h:0.65, grip:0.98,
   redline:6000, gears:[3.0,1.9,1.3,1.0,0.72], final:3.7, wheelR:0.34, steer:38, drag:0.52, color:'#ff7b2d', tier:3,
   blurb:'V8 pickup with an empty bed. Light rear end, loves to slide.'},
  {id:'stallion', name:'Stallion GT', price:38000, style:'muscle', len:19, wid:9, power:350, mass:1700, a:1.35, b:1.45, h:0.52, grip:1.04,
   redline:7200, gears:[3.66,2.43,1.69,1.32,1.0,0.65], final:3.55, wheelR:0.34, steer:35, drag:0.44, color:'#ffd23d', tier:3,
   blurb:'Modern pony car. Coyote V8, six speeds, endless smoke.'},
  {id:'bavaria', name:'Bavaria M', price:45000, style:'sedan', len:19, wid:9, power:330, mass:1600, a:1.35, b:1.4, h:0.5, grip:1.08,
   redline:7600, gears:[4.06,2.4,1.58,1.19,1.0,0.87], final:3.15, wheelR:0.34, steer:35, drag:0.40, color:'#5a5a6e', tier:3,
   blurb:'German super saloon. Precise, fast and very serious.'},
  {id:'tsunami', name:'Tsunami TA', price:90000, style:'gt', len:18, wid:9, power:460, mass:1250, a:1.3, b:1.35, h:0.42, grip:1.15,
   redline:8500, gears:[3.1,2.1,1.55,1.22,1.0,0.84], final:3.9, wheelR:0.33, steer:36, drag:0.42, color:'#b6ff3d', tier:4,
   blurb:'Stripped time-attack monster with a huge wing. Grip king.'},
  {id:'hyperion', name:'Hyperion X', price:250000, style:'super', len:19, wid:10, power:760, mass:1380, a:1.5, b:1.3, h:0.4, grip:1.22,
   redline:9200, gears:[3.0,2.1,1.62,1.3,1.08,0.9], final:3.5, wheelR:0.35, steer:34, drag:0.38, color:'#9b4dff', tier:4,
   blurb:'The fastest thing in the game. Over 1000 hp. Good luck.'},
];
CARS.sort((a, b) => a.price - b.price);
const CAR_BY_ID = Object.fromEntries(CARS.map(c => [c.id, c]));
const TIER_COST = {1:1, 2:1.6, 3:2.6, 4:4};

// ---- Parts ----
// Each category: ordered list of levels. Level 0 is stock (free, always owned).
// New levels are only ever appended so saved games keep pointing at the right part.
const PART_GROUPS = [
  ['Engine', ['engine', 'internals', 'cams', 'turbo', 'intercooler', 'intake', 'exhaust', 'ecu', 'fuel', 'nitrous']],
  ['Drivetrain', ['gearbox', 'clutch', 'flywheel', 'diff']],
  ['Chassis', ['suspension', 'swaybar', 'brace', 'brakes', 'handbrake', 'steering', 'weight', 'wheels']],
  ['Grip & Aero', ['tires', 'aero']],
];
const PARTS = {
  engine:{name:'Engine Block', icon:'ENG', levels:[
    {n:'Stock Engine'}, {n:'Street Build', p:900, pow:1.12, d:'+12% power'}, {n:'Sport Build', p:2600, pow:1.26, d:'+26% power'}, {n:'Race Build', p:6500, pow:1.45, d:'+45% power'},
    {n:'Built Motor', p:14000, pow:1.68, d:'+68% power. Fully built, no limits'}]},
  internals:{name:'Internals', icon:'PST', levels:[
    {n:'Cast Internals'}, {n:'Forged Pistons', p:1800, pow:1.03, boostMax:1.6, d:'+3% power, Boost tune up to 160%'},
    {n:'Forged Rods & Crank', p:4200, pow:1.06, boostMax:1.8, rev:300, d:'+6% power, +300 rpm, Boost up to 180%'}]},
  cams:{name:'Camshafts', icon:'CAM', levels:[
    {n:'Stock Cams'}, {n:'Stage 1 Cams', p:1100, pow:1.05, rev:250, d:'+5% power, +250 rpm'}, {n:'Stage 2 Cams', p:2800, pow:1.1, rev:500, d:'+10% power, +500 rpm'},
    {n:'Stage 3 Race Cams', p:5200, pow:1.15, rev:800, d:'+15% power, +800 rpm, lumpy idle'}]},
  turbo:{name:'Forced Induction', icon:'TRB', levels:[
    {n:'Naturally Aspirated'}, {n:'Small Turbo', p:3000, boost:0.20, d:'+20% power, unlocks Boost tune'}, {n:'Big Turbo', p:7800, boost:0.42, d:'+42% power, unlocks Boost tune'},
    {n:'Supercharger', p:6000, boost:0.32, d:'+32% power, instant response, unlocks Boost tune'}, {n:'Twin Turbo', p:15000, boost:0.62, d:'+62% power, unlocks Boost tune'}]},
  intercooler:{name:'Intercooler', icon:'ICL', levels:[
    {n:'Stock Intercooler'}, {n:'Front Mount', p:1200, ic:1.05, d:'+5% power on boosted cars'}, {n:'Race Intercooler', p:2600, ic:1.09, d:'+9% power on boosted cars'}]},
  intake:{name:'Intake', icon:'INT', levels:[
    {n:'Stock Intake'}, {n:'Cold Air Intake', p:450, pow:1.04, d:'+4% power'}, {n:'Velocity Stacks', p:1400, pow:1.07, d:'+7% power, sounds amazing'}]},
  exhaust:{name:'Exhaust', icon:'EXH', levels:[
    {n:'Stock Exhaust'}, {n:'Cat-back', p:650, pow:1.04, d:'+4% power, louder'}, {n:'Straight Pipe', p:1500, pow:1.08, d:'+8% power, very loud'},
    {n:'Titanium Race Exhaust', p:3200, pow:1.1, mass:0.99, d:'+10% power, -1% weight'}]},
  ecu:{name:'ECU', icon:'ECU', levels:[
    {n:'Stock ECU'}, {n:'Street Tune', p:1000, pow:1.04, d:'+4% power, unlocks Rev Limit tune'}, {n:'Standalone ECU', p:3000, pow:1.08, d:'+8% power, unlocks Rev Limit tune'}]},
  fuel:{name:'Fuel', icon:'FUL', levels:[
    {n:'Pump Gas'}, {n:'Race Fuel', p:900, pow:1.04, d:'+4% power'}, {n:'E85 Flex Fuel', p:2200, pow:1.06, ic:1.04, d:'+6% power, +4% more on boosted cars'}]},
  nitrous:{name:'Nitrous', icon:'NOS', levels:[
    {n:'No Nitrous'}, {n:'Nitrous Kit', p:2500, nos:4, d:'4s bottle. Hold N / NOS. Unlocks Shot Size tune'},
    {n:'Big Shot Kit', p:6000, nos:7, d:'7s bottle. Unlocks Shot Size tune'}]},
  gearbox:{name:'Gearbox', icon:'GBX', levels:[
    {n:'Stock Gearbox', shift:0.28}, {n:'Sport Gearbox', p:1500, shift:0.16, d:'Faster shifts, unlocks Final Drive in the Gearbox tuner'},
    {n:'Sequential', p:4800, shift:0.06, d:'Instant shifts, unlocks every gear ratio in the Gearbox tuner'},
    {n:'6-Speed Dog Box', p:8500, shift:0.04, six:true, d:'Adds a 6th gear, instant shifts, full Gearbox tuner'}]},
  clutch:{name:'Clutch', icon:'CLT', levels:[
    {n:'Stock Clutch', shiftMul:1}, {n:'Sport Clutch', p:700, shiftMul:0.85, d:'Faster shifts, better launches'}, {n:'Twin Plate', p:1900, shiftMul:0.7, launch:1, d:'Much faster shifts, clutch-kick launches'}]},
  flywheel:{name:'Flywheel', icon:'FLY', levels:[
    {n:'Stock Flywheel'}, {n:'Lightweight Flywheel', p:800, pow:1.02, shiftMul:0.9, d:'Revs faster, +2% power'}, {n:'Chromoly Flywheel', p:1700, pow:1.04, shiftMul:0.8, d:'Revs much faster, +4% power'}]},
  diff:{name:'Differential', icon:'DIF', levels:[
    {n:'Open Diff', lock:0.15}, {n:'LSD', p:1400, lock:0.55, d:'Easier drifts, unlocks Diff Lock tune'}, {n:'Welded Diff', p:500, lock:1.0, d:'Max lock. Drifts forever, hates parking'}]},
  suspension:{name:'Suspension', icon:'SUS', levels:[
    {n:'Stock Suspension', resp:1}, {n:'Sport Springs', p:900, resp:1.06, d:'Sharper response, unlocks Ride Height'},
    {n:'Coilovers', p:3200, resp:1.12, d:'Unlocks Springs, Camber, Ride Height'}, {n:'Pro Drift Coilovers', p:6500, resp:1.18, d:'Best response, unlocks Springs, Camber, Ride Height'}]},
  swaybar:{name:'Sway Bars', icon:'ARB', levels:[
    {n:'Stock Sway Bars'}, {n:'Adjustable Sway Bars', p:900, resp:1.03, d:'Unlocks Sway Bar F/R tune'}]},
  brace:{name:'Chassis', icon:'CHS', levels:[
    {n:'Stock Chassis'}, {n:'Strut Brace', p:400, resp:1.02, d:'Slightly sharper steering'}, {n:'Bolt-in Roll Cage', p:2400, resp:1.06, mass:1.02, d:'Stiffer chassis, +2% weight'},
    {n:'Welded Cage', p:5200, resp:1.1, mass:1.01, d:'Much stiffer chassis'}]},
  brakes:{name:'Brakes', icon:'BRK', levels:[
    {n:'Stock Brakes', br:1}, {n:'Sport Pads', p:700, br:1.2, d:'+20% braking'}, {n:'Big Brake Kit', p:2200, br:1.45, d:'+45% braking'}, {n:'Carbon Ceramics', p:6000, br:1.7, mass:0.99, d:'+70% braking, -1% weight'}]},
  handbrake:{name:'Handbrake', icon:'HB', levels:[
    {n:'Cable Handbrake', hb:0.25, hbF:0.55}, {n:'Hydraulic E-Brake', p:1100, hb:0.15, hbF:0.75, d:'Locks the rears harder: easy drift entries'}]},
  steering:{name:'Steering', icon:'STR', levels:[
    {n:'Stock Rack', lockMax:0}, {n:'Angle Kit', p:2000, lockMax:65, d:'Unlocks Steering Lock tune (up to 65 deg)'}, {n:'Super Lock Knuckles', p:5500, lockMax:75, d:'Steering Lock up to 75 deg'}]},
  weight:{name:'Weight', icon:'WGT', levels:[
    {n:'Stock Weight', mass:1}, {n:'Stripped Interior', p:800, mass:0.94, d:'-6% weight'}, {n:'Carbon Panels', p:3500, mass:0.88, d:'-12% weight'}, {n:'Race Shell', p:8000, mass:0.81, d:'-19% weight'}]},
  wheels:{name:'Wheels', icon:'WHL', levels:[
    {n:'Steel Wheels'}, {n:'Alloy Wheels', p:600, mass:0.985, d:'-1.5% weight'}, {n:'Forged Wheels', p:2000, mass:0.97, resp:1.02, d:'-3% weight, sharper response'}]},
  tires:{name:'Tyres', icon:'TYR', levels:[
    {n:'Street Tyres', muF:1, muR:1}, {n:'Sport Tyres', p:600, muF:1.1, muR:1.1, d:'+10% grip'},
    {n:'Semi-Slicks', p:1900, muF:1.24, muR:1.24, d:'+24% grip, for racing'}, {n:'Drift Spec', p:1500, muF:1.18, muR:0.98, d:'Grippy fronts, slidey rears'},
    {n:'Race Slicks', p:4500, muF:1.36, muR:1.36, d:'+36% grip. Race only, hard to drift'}, {n:'Pro Drift Tyres', p:3000, muF:1.26, muR:1.02, d:'Max front bite, controllable rears'}]},
  aero:{name:'Aero', icon:'AER', levels:[
    {n:'No Aero', dfF:0, dfR:0}, {n:'Front Splitter', p:1300, dfF:0.5, dfR:0, d:'Front downforce at speed'},
    {n:'Splitter + Rear Wing', p:3800, dfF:0.5, dfR:0.6, d:'Downforce front and rear, unlocks Wing Angle tune'},
    {n:'Time Attack Kit', p:9000, dfF:0.9, dfR:1.0, d:'Huge downforce, unlocks Wing Angle tune'}]},
};
// what each existing part unlocks (tuning checks these flags, so new parts can slot in anywhere)
Object.assign(PARTS.turbo.levels[1], {spool: 0.8}); Object.assign(PARTS.turbo.levels[2], {spool: 1.3}); Object.assign(PARTS.turbo.levels[3], {sc: 1}); Object.assign(PARTS.turbo.levels[4], {spool: 0.95});
Object.assign(PARTS.ecu.levels[1], {revMax: 800}); Object.assign(PARTS.ecu.levels[2], {revMax: 1500});
for (const i of [1, 2, 3]) PARTS.exhaust.levels[i].loud = [0, 0.5, 1, 1][i];
for (const i of [2, 3]) PARTS.gearbox.levels[i].ratios = 1;
for (const i of [2, 3]) PARTS.suspension.levels[i].coil = 1;
PARTS.swaybar.levels[1].adj = 1; PARTS.diff.levels[1].adj = 1;
for (const i of [2, 3]) PARTS.aero.levels[i].wing = 1;
// lots more to choose from in every category (added on the end so saved cars keep their parts)
const MORE_PARTS = {
  engine: [{n:'Big Bore Kit', p:4200, pow:1.34, d:'+34% power from bigger cylinders'}, {n:'Stroker Kit', p:9000, pow:1.52, rev:-300, d:'+52% power, huge torque, -300 rpm'},
    {n:'Rotary Swap', p:11000, pow:1.4, rev:1500, mass:0.97, d:'+40% power, +1500 rpm, -3% weight. Screams'}, {n:'V8 Swap', p:16000, pow:1.75, rev:-800, mass:1.05, d:'+75% power, -800 rpm, +5% weight. Torque monster'},
    {n:'Inline-6 Swap', p:18000, pow:1.62, rev:300, mass:1.03, d:'+62% power, +300 rpm, loves boost'}],
  internals: [{n:'Low Compression Pistons', p:2600, pow:0.99, boostMax:1.9, d:'-1% power, but Boost up to 190%'}, {n:'Billet Crank & Rods', p:6500, pow:1.08, boostMax:2.0, rev:500, d:'+8% power, +500 rpm, Boost up to 200%'}],
  cams: [{n:'Drift Cams', p:1900, pow:1.07, rev:200, d:'+7% power, punchy mid-range, +200 rpm'}, {n:'Billet Race Cams', p:7400, pow:1.19, rev:1000, d:'+19% power, +1000 rpm'}],
  turbo: [{n:'Ball Bearing Turbo', p:5200, boost:0.3, spool:0.6, d:'+30% power, spools up fast'}, {n:'Twin Scroll Turbo', p:6500, boost:0.36, spool:0.75, d:'+36% power, quick spool'},
    {n:'Centrifugal Supercharger', p:7200, boost:0.38, spool:1.1, d:'+38% power, boost builds with revs'}, {n:'Roots Blower', p:9000, boost:0.45, sc:1, d:'+45% power, instant boost, sticks out the hood'},
    {n:'Huge Single Turbo', p:12000, boost:0.78, spool:1.7, d:'+78% power, massive lag then everything at once'}, {n:'Electric Turbo', p:14000, boost:0.42, spool:0.3, d:'+42% power, almost no lag'},
    {n:'Quad Turbo', p:24000, boost:0.92, spool:1.1, d:'+92% power. Completely unreasonable'}],
  intercooler: [{n:'Top Mount', p:900, ic:1.04, d:'+4% power on boosted cars'}, {n:'Water-to-Air', p:3400, ic:1.11, d:'+11% power on boosted cars'}],
  intake: [{n:'Short Ram Intake', p:300, pow:1.03, d:'+3% power'}, {n:'Carbon Airbox', p:2400, pow:1.09, d:'+9% power'}, {n:'Individual Throttle Bodies', p:4200, pow:1.11, rev:200, d:'+11% power, +200 rpm, razor sharp'}],
  exhaust: [{n:'Dual Exit Muffler', p:900, pow:1.05, loud:0.5, d:'+5% power, nice rumble'}, {n:'Side Exit Drift Pipe', p:1100, pow:1.06, loud:1, d:'+6% power, shoots flames sideways'},
    {n:'Equal Length Headers', p:2400, pow:1.08, loud:0.6, d:'+8% power'}, {n:'Anti-Lag Race System', p:5200, pow:1.12, loud:1, d:'+12% power, pops and bangs'}],
  ecu: [{n:'Piggyback Tune', p:600, pow:1.02, revMax:500, d:'+2% power, unlocks Rev Limit tune'}, {n:'Flash Tune', p:1800, pow:1.06, revMax:1000, d:'+6% power, unlocks Rev Limit tune'},
    {n:'Motorsport ECU', p:6000, pow:1.11, revMax:2000, d:'+11% power, Rev Limit up to +2000 rpm'}],
  fuel: [{n:'High Flow Pump', p:500, pow:1.02, d:'+2% power'}, {n:'Methanol Injection', p:3200, pow:1.05, ic:1.07, d:'+5% power, +7% more on boosted cars'}, {n:'E100 Race Ethanol', p:4000, pow:1.08, ic:1.06, d:'+8% power, +6% more on boosted cars'}],
  nitrous: [{n:'Dry Shot Kit', p:1800, nos:3, d:'3s bottle. Unlocks Shot Size tune'}, {n:'Wet Shot Kit', p:4000, nos:5, d:'5s bottle. Unlocks Shot Size tune'}, {n:'Direct Port Nitrous', p:9500, nos:9, d:'9s bottle. Unlocks Shot Size tune'}],
  gearbox: [{n:'Close Ratio 5-Speed', p:2800, shift:0.12, d:'Quick shifts, unlocks Final Drive'}, {n:'H-Pattern Dog Box', p:6200, shift:0.08, ratios:1, d:'Clunky fast shifts, unlocks every gear ratio'},
    {n:'Paddle Shift DCT', p:12000, shift:0.02, six:true, ratios:1, d:'Lightning shifts, 6th gear, full Gearbox tuner'}],
  clutch: [{n:'Stage 2 Clutch', p:1200, shiftMul:0.78, d:'Faster shifts'}, {n:'Ceramic Puck Clutch', p:1500, shiftMul:0.75, launch:1, d:'Grabby, fast shifts, clutch-kick launches'}, {n:'Triple Plate', p:3800, shiftMul:0.6, launch:1, d:'Fastest shifts, clutch-kick launches'}],
  flywheel: [{n:'Aluminium Flywheel', p:1300, pow:1.03, shiftMul:0.85, d:'Revs faster, +3% power'}, {n:'Twin Disc Flywheel', p:2600, pow:1.05, shiftMul:0.75, d:'Revs fastest, +5% power'}],
  diff: [{n:'Helical LSD', p:1000, lock:0.4, d:'Gentle lock, good for grip'}, {n:'1.5-Way LSD', p:2100, lock:0.65, adj:1, d:'Locks on and off throttle, unlocks Diff Lock tune'},
    {n:'2-Way LSD', p:2900, lock:0.75, adj:1, d:'Drift favourite, unlocks Diff Lock tune'}, {n:'Spool Diff', p:900, lock:1.0, mass:0.995, d:'Solid lock, lighter than a welded diff'}],
  suspension: [{n:'Lowering Springs', p:600, resp:1.04, d:'Slammed look, unlocks Ride Height'}, {n:'Street Coilovers', p:2000, resp:1.09, coil:1, d:'Unlocks Springs, Camber, Ride Height'},
    {n:'Air Suspension', p:4200, resp:1.05, coil:1, d:'Air ride. Unlocks Springs, Camber, Ride Height'}, {n:'Rally Suspension', p:3800, resp:1.08, coil:1, d:'Soaks up bumps. Unlocks full suspension tune'},
    {n:'Time Attack Coilovers', p:8800, resp:1.22, coil:1, d:'Sharpest response, full suspension tune'}],
  swaybar: [{n:'Thick Front Bar', p:500, resp:1.02, d:'Slightly sharper, no tuning'}, {n:'Race Sway Bars', p:1800, resp:1.05, adj:1, d:'Sharper response, unlocks Sway Bar F/R tune'}],
  brace: [{n:'Front + Rear Braces', p:900, resp:1.04, d:'Sharper steering'}, {n:'Seam Welded Chassis', p:3500, resp:1.08, d:'Much stiffer chassis, no extra weight'}, {n:'Tube Frame Chassis', p:12000, resp:1.12, mass:0.92, d:'Pro chassis, -8% weight'}],
  brakes: [{n:'Slotted Rotors', p:1200, br:1.3, d:'+30% braking'}, {n:'6-Piston Calipers', p:3800, br:1.58, d:'+58% braking'}, {n:'Drift Twin Calipers', p:4200, br:1.5, d:'+50% braking, a separate caliper for the handbrake'}],
  handbrake: [{n:'Fly-off Handle', p:350, hb:0.22, hbF:0.62, d:'Quicker handbrake pulls'}, {n:'Hydro + Twin Caliper', p:2400, hb:0.12, hbF:0.85, d:'Big rear lock for steep entries'}, {n:'Pro Drift Hydro', p:3800, hb:0.1, hbF:0.95, d:'Strongest handbrake there is'}],
  steering: [{n:'Quick Rack', p:1500, lockMax:50, resp:1.04, d:'Sharper steering, lock up to 50 deg'}, {n:'Modified Knuckles', p:1000, lockMax:55, d:'Steering Lock up to 55 deg'}, {n:'Extreme Lock Kit', p:9000, lockMax:80, d:'Steering Lock up to 80 deg'}],
  weight: [{n:'Lexan Windows', p:1500, mass:0.97, d:'-3% weight'}, {n:'Carbon Hood & Trunk', p:2200, mass:0.95, d:'-5% weight'}, {n:'Gutted Race Car', p:12000, mass:0.77, d:'-23% weight. Nothing left inside'}],
  wheels: [{n:'Lightweight Alloys', p:1100, mass:0.978, d:'-2.2% weight'}, {n:'Deep Dish Wheels', p:1400, mass:0.99, d:'-1% weight, maximum style'},
    {n:'Magnesium Race Wheels', p:4200, mass:0.96, resp:1.03, d:'-4% weight, sharper response'}, {n:'Carbon Wheels', p:7000, mass:0.95, resp:1.04, d:'-5% weight, sharpest response'}],
  tires: [{n:'All-Season Tyres', p:300, muF:1.04, muR:1.04, d:'+4% grip'}, {n:'Hard Compound Rears', p:500, muF:1.0, muR:0.88, d:'Skating rears, easy slides, bad for racing'},
    {n:'Budget Drift Tyres', p:700, muF:1.08, muR:0.92, d:'Cheap and slidey'}, {n:'Street Performance', p:1100, muF:1.16, muR:1.16, d:'+16% grip'},
    {n:'Competition Drift', p:4200, muF:1.32, muR:1.06, d:'Huge front bite, smoky rears'}],
  aero: [{n:'Ducktail Spoiler', p:800, dfF:0, dfR:0.25, d:'A little rear downforce'}, {n:'Canards + Diffuser', p:2200, dfF:0.4, dfR:0.35, d:'Balanced downforce, no wing'},
    {n:'Drift Aero Kit', p:2800, dfF:0.35, dfR:0.3, wing:1, d:'Light downforce, unlocks Wing Angle tune'}, {n:'GT Wing', p:5200, dfF:0.3, dfR:0.9, wing:1, d:'Big rear downforce, unlocks Wing Angle tune'}],
};
for (const k in MORE_PARTS) PARTS[k].levels.push(...MORE_PARTS[k]);
// a 1-5 tier for each part by price (colours the icons)
for (const k in PARTS) { const L = PARTS[k].levels, top = Math.max(...L.map(l => l.p || 0)); L.forEach(l => { l.tier = l.p ? 1 + Math.min(4, Math.floor(l.p / top * 5)) : 0; }); }
const PL = (p, k) => PARTS[k].levels[p[k] || 0];
const PART_ORDER = Object.keys(PARTS);

// ---- Tuning ----  (max may be a function of installed parts)
const TUNES = [
  {k:'final', gb:true, n:'Final Drive', min:2.4, max:5.8, step:0.05, def:c=>c.final, fmt:v=>(+v).toFixed(2), req:p=>p.gearbox>=1, why:'Needs an upgraded gearbox',
   help:'Higher = faster acceleration, lower top speed'},
  {k:'boost', n:'Boost', min:0.5, max:p=>(PARTS.internals.levels[p.internals||0].boostMax||1.3), step:0.05, def:()=>1, fmt:v=>Math.round(v*100)+'%', req:p=>p.turbo>=1, why:'Needs a Turbo or Supercharger',
   help:'More boost = more power. Forged internals let you go higher'},
  {k:'rev', n:'Rev Limit', min:-500, max:p=>PL(p,'ecu').revMax||800, step:100, def:()=>0, fmt:v=>(v>=0?'+':'')+v+' rpm', req:p=>p.ecu>=1, why:'Needs a tuned ECU',
   help:'Rev higher to stay in a gear longer through a drift'},
  {k:'nosShot', n:'Nitrous Shot', min:30, max:100, step:5, def:()=>60, fmt:v=>'+'+v+'%', req:p=>p.nitrous>=1, why:'Needs a Nitrous Kit',
   help:'Bigger shot = more power, but the bottle empties faster'},
  {k:'tpF', n:'Front Tyre PSI', min:20, max:42, step:1, def:()=>32, fmt:v=>v+' psi', req:()=>true,
   help:'Lower = more grip, higher = sharper response'},
  {k:'tpR', n:'Rear Tyre PSI', min:20, max:42, step:1, def:()=>32, fmt:v=>v+' psi', req:()=>true,
   help:'Pump the rears up to make the car slide easier'},
  {k:'camF', n:'Front Camber', min:-6, max:0, step:0.1, def:()=>-1, fmt:v=>(+v).toFixed(1)+' deg', req:p=>!!PL(p,'suspension').coil, why:'Needs Coilovers',
   help:'About -2.5 gives the most front grip'},
  {k:'camR', n:'Rear Camber', min:-6, max:0, step:0.1, def:()=>-1, fmt:v=>(+v).toFixed(1)+' deg', req:p=>!!PL(p,'suspension').coil, why:'Needs Coilovers',
   help:'Less rear camber = less rear grip, more slide'},
  {k:'sprF', n:'Front Springs', min:1, max:10, step:1, def:()=>5, fmt:v=>v+'/10', req:p=>!!PL(p,'suspension').coil, why:'Needs Coilovers',
   help:'Stiffer front than rear = understeer'},
  {k:'sprR', n:'Rear Springs', min:1, max:10, step:1, def:()=>5, fmt:v=>v+'/10', req:p=>!!PL(p,'suspension').coil, why:'Needs Coilovers',
   help:'Stiffer rear than front = oversteer'},
  {k:'arbF', n:'Front Sway Bar', min:1, max:10, step:1, def:()=>5, fmt:v=>v+'/10', req:p=>!!PL(p,'swaybar').adj, why:'Needs Adjustable Sway Bars',
   help:'Stiffer front bar = more understeer'},
  {k:'arbR', n:'Rear Sway Bar', min:1, max:10, step:1, def:()=>5, fmt:v=>v+'/10', req:p=>!!PL(p,'swaybar').adj, why:'Needs Adjustable Sway Bars',
   help:'Stiffer rear bar = looser rear, easier to rotate'},
  {k:'height', n:'Ride Height', min:0, max:10, step:1, def:()=>5, fmt:v=>v+'/10', req:p=>p.suspension>=1, why:'Needs Sport Springs',
   help:'Lower = less body roll, more stable'},
  {k:'steer', n:'Steering Lock', min:28, max:p=>Math.max(40, PARTS.steering.levels[p.steering||0].lockMax), step:1, def:c=>c.steer, fmt:v=>v+' deg', req:p=>p.steering>=1, why:'Needs Angle Kit',
   help:'More lock = bigger drift angles without spinning'},
  {k:'diff', n:'Diff Lock', min:0.2, max:0.95, step:0.05, def:()=>0.55, fmt:v=>Math.round(v*100)+'%', req:p=>!!PL(p,'diff').adj, why:'Needs an adjustable LSD',
   help:'More lock = easier, longer drifts'},
  {k:'wing', n:'Wing Angle', min:0, max:10, step:1, def:()=>5, fmt:v=>v+'/10', req:p=>!!PL(p,'aero').wing, why:'Needs a Rear Wing',
   help:'More angle = more rear grip at speed, but more drag'},
  {k:'bias', n:'Brake Bias', min:40, max:80, step:1, def:()=>62, fmt:v=>v+'% F', req:()=>true,
   help:'Rear-biased brakes help start a drift'},
];
const tuneMax = (t, p) => typeof t.max === 'function' ? t.max(p) : t.max;
// gearbox tuner: individual ratios need a Sequential (or better) box
const gearsTunable = p => !!PL(p, 'gearbox').ratios;
const GEAR_MIN = 0.5, GEAR_MAX = 4.6;
function defaultGears(c, p) { const g = c.gears.slice(); if (p && PARTS.gearbox.levels[p.gearbox || 0].six && g.length < 6) g.push(+(g[g.length - 1] * 0.83).toFixed(2)); return g; }

// ---- Cosmetics ----
const PAINTS = ['#f4f1ff','#c9c9d6','#5a5a6e','#1d1d27','#ff3d3d','#ff3d7f','#ff7b2d','#ffd23d','#b6ff3d','#5dff6a','#1fb36b','#3df2ff','#3d8bff','#2b3fd6','#9b4dff','#ff8fe1','#7a3b1d','#c08a52'];
const COSMETICS = {
  stripe:{n:'Stripes', p:250, opts:['None','Center','Twin','Side']},
  spoiler:{n:'Spoiler', p:500, opts:['None','Ducktail','GT Wing']},
  hood:{n:'Hood', p:350, opts:['Paint','Carbon','Vented']},
  glow:{n:'Underglow', p:600, opts:['None','#ff3d7f','#3df2ff','#5dff6a','#ffd23d','#9b4dff']},
};
const PAINT_COST = 150;

// ---- Tracks ----
// city-block corners: turn each corner into before/after points so the spline makes a tight ~90 degree bend
function blockCorners(list, r) {
  const out = [], n = list.length;
  for (let i = 0; i < n; i++) {
    const p = list[i], a = list[(i - 1 + n) % n], b = list[(i + 1) % n];
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1]);
    out.push([p[0] + (a[0] - p[0]) / da * r, p[1] + (a[1] - p[1]) / da * r], [p[0] + (b[0] - p[0]) / db * r, p[1] + (b[1] - p[1]) / db * r]);
  }
  return out;
}
// Closed Catmull-Rom control points in world px. theme drives decoration.
const TRACKS = {
  harbor:{name:'Harbor Loop', theme:'harbor', pts:[[300,320],[700,250],[1150,260],[1500,330],[1650,520],[1580,760],[1350,840],[1150,760],[960,700],[800,780],[720,1000],[520,1110],[300,1050],[200,820],[220,540]]},
  touge:{name:'Akina-ish Pass', theme:'forest', pts:[[260,200],[900,180],[1500,200],[1660,320],[1540,450],[1000,470],[480,470],[330,590],[470,720],[1000,730],[1520,740],[1680,880],[1540,1010],[900,1020],[300,1000],[170,820],[150,500],[160,280]]},
  city:{name:'Neon City', theme:'city', pts:[[260,260],[700,250],[1150,250],[1290,290],[1330,420],[1330,640],[1290,760],[1160,800],[960,800],[880,860],[870,1050],[820,1170],[680,1210],[420,1210],[280,1170],[230,1040],[240,860],[310,700],[240,540],[220,400]]},
  downtown:{name:'Downtown Blocks', theme:'city', pts:blockCorners([[200,200],[900,200],[900,450],[1300,450],[1300,1000],[800,1000],[800,750],[500,750],[500,1000],[200,1000]], 70)},
  mountain:{name:'Mountain Hairpins', theme:'mountain', pts:[[200,1100],[900,1150],[1400,1080],[1550,950],[1450,830],[1000,800],[700,760],[600,640],[720,540],[1150,520],[1450,450],[1550,320],[1400,200],[800,180],[350,230],[180,400],[220,700],[180,950]]},
  sakura:{name:'Sakura Park', theme:'sakura', pts:[[300,300],[700,220],[1100,300],[1300,500],[1200,700],[950,720],[800,850],[900,1050],[1200,1100],[1450,1000],[1600,1150],[1450,1350],[900,1380],[450,1300],[250,1100],[350,900],[200,700],[180,480]]},
  desert:{name:'Desert Canyon', theme:'desert', pts:[[250,250],[1300,220],[1500,400],[1350,600],[1000,560],[800,700],[1000,850],[1500,850],[1600,1050],[1300,1200],[600,1180],[300,1000],[400,750],[220,550]]},
  lot:{name:'Skidpad Lot', theme:'lot', pts:[[400,400],[800,330],[1200,400],[1330,600],[1200,800],[800,870],[400,800],[270,600]]},
};

// ---- Events ----
// Drift events are always free (so you can never go broke). Races and tandems charge an entry fee but pay big.
const EVENTS = [
  {id:'d1', type:'drift', track:'lot', laps:3, name:'Lot Warm-Up', tf:0.8, reward:[300,700,1300], pr:150},
  {id:'t1', type:'tandem', track:'lot', laps:3, name:'Tandem School', tf:1.1, fee:200, aiSkill:0.84, aiTop:40, reward:[700,1500,2800], pr:160},
  {id:'r1', type:'race', track:'harbor', laps:2, name:'Harbor Sprint', fee:300, ai:3, aiSkill:0.78, aiTop:46, reward:[6300,3600,1800,500], pr:180},
  {id:'d2', type:'drift', track:'harbor', laps:2, name:'Harbor Slide', tf:1, reward:[500,1100,2000], pr:190},
  {id:'d6', type:'drift', track:'downtown', laps:2, name:'Downtown Slide', tf:1.1, reward:[700,1500,2800], pr:200},
  {id:'r7', type:'race', track:'downtown', laps:3, name:'Block Party GP', fee:600, ai:3, aiSkill:0.85, aiTop:48, reward:[10800,6000,2700,800], pr:215},
  {id:'r2', type:'race', track:'city', laps:3, name:'Neon Nights', fee:800, ai:3, aiSkill:0.88, aiTop:52, reward:[12600,7200,3300,1000], pr:230},
  {id:'t2', type:'tandem', track:'sakura', laps:2, name:'Petal Chase', tf:1.2, fee:700, aiSkill:0.88, aiTop:46, reward:[1600,3400,6000], pr:235},
  {id:'d7', type:'drift', track:'sakura', laps:2, name:'Sakura Drift', tf:1.2, reward:[900,2000,3800], pr:240},
  {id:'d3', type:'drift', track:'touge', laps:1, name:'Mountain Pass', tf:1.15, reward:[900,2000,3800], pr:245},
  {id:'r9', type:'race', track:'sakura', laps:3, name:'Blossom Sprint', fee:1300, ai:3, aiSkill:0.93, aiTop:56, reward:[19500,10800,4800,1400], pr:265},
  {id:'r3', type:'race', track:'touge', laps:2, name:'Downhill Battle', fee:1600, ai:3, aiSkill:0.95, aiTop:58, reward:[22500,12600,5700,1700], pr:280},
  {id:'t3', type:'tandem', track:'downtown', laps:2, name:'Street Tandem', tf:1.3, fee:1500, aiSkill:0.92, aiTop:50, reward:[3000,6500,11000], pr:290},
  {id:'d4', type:'drift', track:'city', laps:2, name:'City Kings', tf:1.3, reward:[1500,3500,7000], pr:300},
  {id:'d8', type:'drift', track:'mountain', laps:1, name:'Mountain Hairpins', tf:1.35, reward:[1800,4000,8000], pr:320},
  {id:'r8', type:'race', track:'desert', laps:3, name:'Canyon Cup', fee:3000, ai:3, aiSkill:1.0, aiTop:64, reward:[39000,21000,9600,2900], pr:350},
  {id:'t4', type:'tandem', track:'mountain', laps:1, name:'Mountain Tandem', tf:1.45, fee:2500, aiSkill:0.95, aiTop:52, reward:[5000,10000,18000], pr:360},
  {id:'r4', type:'race', track:'harbor', laps:4, name:'Harbor GP', fee:3500, ai:3, aiSkill:1.03, aiTop:66, reward:[42000,22500,11100,3300], pr:380},
  {id:'d9', type:'drift', track:'desert', laps:2, name:'Canyon Run', tf:1.4, reward:[2200,5000,10000], pr:400},
  {id:'d5', type:'drift', track:'touge', laps:2, name:'Touge King', tf:1.5, reward:[2500,6000,12000], pr:420},
  {id:'r10', type:'race', track:'mountain', laps:2, name:'Summit Showdown', fee:6000, ai:3, aiSkill:1.08, aiTop:72, reward:[72000,39000,18000,5400], pr:450},
  {id:'t5', type:'tandem', track:'sakura', laps:3, name:'Blossom Masters', tf:1.6, fee:5000, aiSkill:1.0, aiTop:58, reward:[9000,18000,32000], pr:460},
  {id:'r5', type:'race', track:'city', laps:4, name:'Midnight Legends', fee:6500, ai:3, aiSkill:1.1, aiTop:76, reward:[78000,42000,20400,6100], pr:480},
  {id:'r6', type:'race', track:'touge', laps:3, name:'Hyper Shootout', fee:12000, ai:3, aiSkill:1.18, aiTop:90, reward:[150000,81000,39000,11700], pr:620},
];

// Redeemable codes (Settings > Codes). Lowercase keys.
const CODES = {test: {cash: 100000000}};

// ---- Body kits ----  (cosmetic; each car gets its own three kits built from these pieces)
// lip: front splitter, skirt: side skirts, wide: paint-matched widebody, flare: bolt-on overfenders,
// canard, diffuser, scoop: roof scoop, vents: hood louvres, tow: tow hooks, bash: bull bar, rack: roof rack + light bar
const KIT_STYLES = {
  street: {f: ['lip', 'skirt'], p: 900, d: 'Front lip and side skirts. Clean and low.'},
  bolt: {f: ['flare', 'lip', 'tow', 'vents'], p: 2400, d: 'Riveted overfenders, vented hood, tow hooks. Pure drift style.'},
  wide: {f: ['wide', 'lip', 'skirt', 'diffuser'], p: 3200, d: 'Smooth paint-matched widebody with a rear diffuser.'},
  attack: {f: ['wide', 'lip', 'canard', 'diffuser', 'vents', 'scoop'], p: 4800, d: 'Time attack aero: canards, louvres, roof scoop.'},
  rally: {f: ['bash', 'rack', 'flare', 'tow'], p: 2200, d: 'Bull bar, roof light bar and mud-ready flares.'},
};
const BODY_KITS = {
  hachi: [['Hachi Street', 'street'], ['Tofu Bolt-on', 'bolt'], ['Akina Rally', 'rally']],
  kei: [['Kei Street', 'street'], ['Pocket Rocket', 'bolt'], ['Mini Attack', 'attack']],
  van: [['Courier Street', 'street'], ['Postie Overland', 'rally'], ['Van-tastic Wide', 'wide']],
  mira: [['Mira Street', 'street'], ['Mira Widebody', 'wide'], ['Mira Attack', 'attack']],
  hatch: [['Hatch Street', 'street'], ['Hatch Rally', 'rally'], ['Hatch Attack', 'attack']],
  estate: [['Estate Street', 'street'], ['Estate Bolt-on', 'bolt'], ['Estate Widebody', 'wide']],
  strada: [['Strada Street', 'street'], ['Strada Bolt-on', 'bolt'], ['Strada Widebody', 'wide']],
  ronin: [['Ronin Street', 'street'], ['Ronin Widebody', 'wide'], ['Ronin Attack', 'attack']],
  chase: [['Chase Street', 'street'], ['Chase Bolt-on', 'bolt'], ['Chase Widebody', 'wide']],
  hauler: [['Hauler Street', 'street'], ['Hauler Overland', 'rally'], ['Hauler Widebody', 'wide']],
  raiden: [['Raiden Street', 'street'], ['Raiden Bolt-on', 'bolt'], ['Raiden Attack', 'attack']],
  bruiser: [['Bruiser Street', 'street'], ['Bruiser Bolt-on', 'bolt'], ['Bruiser Widebody', 'wide']],
  stallion: [['Stallion Street', 'street'], ['Stallion Widebody', 'wide'], ['Stallion Attack', 'attack']],
  bavaria: [['Bavaria Street', 'street'], ['Bavaria Widebody', 'wide'], ['Bavaria Attack', 'attack']],
  kaiju: [['Kaiju Street', 'street'], ['Kaiju Bolt-on', 'bolt'], ['Kaiju Attack', 'attack']],
  tsunami: [['Tsunami Street', 'street'], ['Tsunami Widebody', 'wide'], ['Tsunami Attack', 'attack']],
  phantom: [['Phantom Street', 'street'], ['Phantom Widebody', 'wide'], ['Phantom Attack', 'attack']],
  hyperion: [['Hyperion Street', 'street'], ['Hyperion Widebody', 'wide'], ['Hyperion Attack', 'attack']],
};
function carKits(id) { return [{n: 'Factory Body', f: [], p: 0, d: 'The body as it left the factory.'}].concat((BODY_KITS[id] || []).map(([n, s]) => ({n, f: KIT_STYLES[s].f, p: Math.round(KIT_STYLES[s].p * TIER_COST[CAR_BY_ID[id].tier]), d: KIT_STYLES[s].d}))); }

// ---- Build focus ----  shown in the shop and garage; drift rating also boosts drift points a little
const FOCUS = [['drift', 'Drift', '#ff3d7f'], ['grip', 'Grip', '#3df2ff'], ['speed', 'Speed', '#ffd23d']];
const RECIPES = {
  drift: 'Welded Diff or LSD, Pro Drift Tyres, Angle Kit, Hydraulic E-Brake, Coilovers, plus power to keep the rears spinning.',
  grip: 'Race Slicks or Semi-Slicks, Time Attack aero, Big Brakes, Coilovers and sway bars, LSD instead of welded.',
  speed: 'Twin Turbo, Built Motor, 6-Speed Dog Box, weight reduction, and skip the big wing (it adds drag).',
};

// ---- Liveries ----  painted over the body on every car. f(x, y, L, W, paint) returns a colour or null for each body pixel.
// x runs tail (0) to nose (L-1); y runs left side (0) to right side (W-1).
const LIVERIES = [
  {n: 'None', p: 0, f: () => null},
  {n: 'Tofu Shop', p: 400, d: 'White and black panda, shop logo on the doors.', f: (x, y, L, W) => {
    const side = y <= 1 || y >= W - 2; if (side && x > L * 0.35 && x < L * 0.6) return y <= 1 ? '#111' : '#111';
    return side ? '#1b1b22' : '#f4f1ff'; }},
  {n: 'Flames', p: 600, d: 'Hot rod flames licking back from the nose.', f: (x, y, L, W) => {
    const t = (L - 1 - x) / L, wave = Math.abs(Math.sin(y * 1.7 + x * 0.9)) * 0.25, edge = Math.min(y, W - 1 - y);
    return t < 0.42 + wave - edge * 0.06 ? (t < 0.2 + wave * 0.6 ? '#ffd23d' : t < 0.32 + wave ? '#ff7b2d' : '#ff3d3d') : null; }},
  {n: 'Checker', p: 500, d: 'Chequered flag tail half.', f: (x, y, L) => x < L * 0.45 ? (((x >> 1) + (y >> 1)) % 2 ? '#111' : '#f4f1ff') : null},
  {n: 'Monster Claw', p: 800, d: 'Black with green claw slashes.', f: (x, y, L, W) => {
    for (let k = 0; k < 3; k++) if (Math.abs((x - L * 0.3 - k * 2.2) - (y - W / 2) * 0.8) < 0.7) return '#5dff6a';
    return '#141418'; }},
  {n: 'Team Racing', p: 700, d: 'Blue, red and yellow sponsor livery.', f: (x, y, L, W) => {
    if (x > L * 0.7) return '#2b3fd6'; if (x > L * 0.62) return '#ffd23d'; if (y <= 1 || y >= W - 2) return '#ff3d3d'; return '#2b3fd6'; }},
  {n: 'Sakura', p: 650, d: 'Pink petals scattered over the body.', f: (x, y) => ((x * 7 + y * 13) % 11 === 0 ? '#ff8fb5' : (x * 5 + y * 3) % 17 === 0 ? '#fff0f6' : null)},
  {n: 'Interceptor', p: 750, d: 'Black and white police style. Not for real chases.', f: (x, y, L, W) => {
    if (x === Math.round(L * 0.48) && y > 1 && y < W - 2) return y < W / 2 ? '#ff3d3d' : '#3d8bff';
    return x > L * 0.3 && x < L * 0.75 ? '#f4f1ff' : '#111'; }},
  {n: 'Rally Stars', p: 650, d: 'Deep blue with gold stars.', f: (x, y, L, W) => ((x % 4 === 1 && y % 3 === 1) ? '#ffd23d' : '#1d3a8a')},
  {n: 'Neon Fade', p: 900, d: 'Pink to cyan synthwave fade.', f: (x, y, L) => { const t = x / L; return t < 0.33 ? '#3df2ff' : t < 0.66 ? '#9b4dff' : '#ff3d7f'; }},
  {n: 'Camo', p: 550, d: 'Woodland camouflage.', f: (x, y) => ['#4a5a2a', '#6b7a3a', '#2f3a1c', '#8a7a4a'][((x * 3 + y * 5 + ((x * y) % 3)) >> 2) % 4]},
  {n: 'Number 86', p: 450, d: 'Classic race roundel on the roof and a hood stripe.', f: (x, y, L, W) => {
    const cx = L * 0.47, cy = (W - 1) / 2, d = Math.hypot(x - cx, y - cy);
    if (d < 2.2) return d < 1 ? '#111' : '#f4f1ff'; return x > L * 0.6 && Math.abs(y - cy) < 1 ? '#111' : null; }},
  {n: 'Carbon Wrap', p: 1000, d: 'Full carbon fibre wrap.', f: (x, y) => ((x + y) % 2 ? '#1a1a1f' : '#2a2a33')},
  {n: 'Gold Chrome', p: 2500, d: 'Show-off gold chrome wrap.', f: (x, y, L, W) => (y === 1 ? '#fff3a8' : (x + y) % 5 === 0 ? '#ffe27a' : '#d4a514')},
];

const DYNO_COST = 50;

// ---- Weather ----  grip scales tyre grip and brakes; pay is the cash bonus for racing in it; w = how often events roll it
const WEATHER = {
  clear: {n: 'Clear', grip: 1, pay: 1, ai: 1, w: 5, d: 'Dry tarmac, full grip.', col: '#ffd23d'},
  sunset: {n: 'Sunset', grip: 1, pay: 1, ai: 1, w: 2, d: 'Golden hour. Looks amazing, drives normal.', col: '#ff7b2d'},
  night: {n: 'Night', grip: 0.97, pay: 1.1, ai: 0.97, w: 2, d: 'Dark out there. Headlights only. +10% cash', col: '#9b4dff'},
  fog: {n: 'Fog', grip: 0.95, pay: 1.1, ai: 0.95, w: 1, d: 'You can barely see the next corner. +10% cash', col: '#c9c9d6'},
  rain: {n: 'Rain', grip: 0.84, pay: 1.2, ai: 0.92, w: 2, d: 'Wet roads: less grip, easier slides, more spray. +20% cash', col: '#3d8bff'},
  storm: {n: 'Storm', grip: 0.78, pay: 1.3, ai: 0.88, w: 1, d: 'Heavy rain and lightning. +30% cash', col: '#3df2ff'},
  snow: {n: 'Snow', grip: 0.7, pay: 1.35, ai: 0.85, w: 1, d: 'Slippery snow. Everything slides. +35% cash', col: '#f4f1ff'},
};

// tips on the loading screen
const LOAD_TIPS = [
  'Tap the handbrake to kick the rear out, then feather the throttle to hold the angle.',
  'Countersteer early. Small steering inputs keep a drift alive longer.',
  'Drift close to the crowd at events for a big cheer.',
  'Bad weather pays a cash bonus in career events.',
  'Rain and snow mean less grip. Go easy on the throttle.',
  'Worn tyres slide more. Fix them at the Mechanic before a race.',
  'A welded or 2-way diff makes long drifts much easier.',
  'More steering lock lets you hold bigger angles without spinning.',
  'Pump up the rear tyre pressure to make the car slide easier.',
  'The Used lot sells built cars cheap, with fresh stock after every event.',
  'Host a public server from the Online menu so anyone can join.',
  'Drift builds earn up to 25% more drift points.',
  'Lower the final drive for top speed, raise it for acceleration.',
  'Turbo cars are laggy low down. Keep the revs up through the drift.',
  'Check the Dyno at the Mechanic to see your real power curve.',
];
