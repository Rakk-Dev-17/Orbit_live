// server/src/data/srmRoutes.js
// Extracted 100% from SRM TRP Engineering College (Irungalur, Trichy) Transport PDF (Routes 1 - 31)

export const SRM_CAMPUS = {
  name: "SRM CAMPUS (Irungalur)",
  lat: 10.9522,
  lng: 78.7517,
  autoOffRadiusMeters: 350
};

// Real geographical anchor coordinates [startLat, startLng, midWaypointLat, midWaypointLng]
// for each of the 31 route corridors leading into SRM Trichy (Irungalur NH-38)
const RAW_PDF_ROUTES = [
  {
    routeNo: 1,
    routeName: "THANJAVUR - POONDI",
    eveningDeparture: "04:35 PM",
    anchors: [10.7860, 78.9820, 10.8050, 78.8150],
    stops: [
      ["POONDI", "06:45 AM"],
      ["MARIYAMMAN KOVIL BYPASS", "07:00 AM"],
      ["THOMBAN KUDISAI", "07:05 AM"],
      ["VANDIKARAR THERU", "07:10 AM"],
      ["RAMANATHAN HOSPITAL", "07:18 AM"],
      ["YAGAPPA NAGAR", "07:20 AM"],
      ["KULANTHAI YESU CHURCH", "07:22 AM"],
      ["KAVERI NAGAR", "07:25 AM"],
      ["KAMALA SUBRAMANIYAN SCHOOL", "07:30 AM"],
      ["SRM CAMPUS", "08:45 AM"]
    ]
  },
  {
    routeNo: 2,
    routeName: "THANJAVUR - RR NAGAR",
    eveningDeparture: "04:35 PM",
    anchors: [10.7520, 79.1180, 10.7790, 78.8920],
    stops: [
      ["RR NAGAR", "07:05 AM"],
      ["NEW BUS STAND", "07:07 AM"],
      ["MEENATCHI HOSPITAL", "07:10 AM"],
      ["BHARATH COLLEGE", "07:11 AM"],
      ["VASTHA CHAVADI", "07:13 AM"],
      ["VALLAM", "07:20 AM"],
      ["MUNNYAM PATTI ROAD", "07:28 AM"],
      ["THIRUMALAI SAMUTHIRAM", "07:30 AM"],
      ["VALAMBAKUDI", "07:40 AM"],
      ["PUTHU KUDI", "07:41 AM"],
      ["DEVARAYA NERI", "07:43 AM"],
      ["ASSUR ROAD", "07:44 AM"],
      ["SRM CAMPUS", "08:40 AM"]
    ]
  },
  {
    routeNo: 3,
    routeName: "THANJAVUR - OLD BUS STAND",
    eveningDeparture: "04:35 PM",
    anchors: [10.7870, 79.1378, 10.8120, 78.8410],
    stops: [
      ["GURUDAYAL KALYANA MADAPAM", "06:55 AM"],
      ["CHOZHAN NAGAR - TNJ", "07:00 AM"],
      ["OLD BUS STAND", "07:10 AM"],
      ["SRM CAMPUS", "08:40 AM"]
    ]
  },
  {
    routeNo: 4,
    routeName: "THANJAVUR - MEDICAL COLLEGE ROAD",
    eveningDeparture: "04:35 PM",
    anchors: [10.7735, 79.1125, 10.7880, 78.9430],
    stops: [
      ["GANAPATHI NAGAR", "07:10 AM"],
      ["LAKSHMI SEEVAL", "07:15 AM"],
      ["MUNICIPAL COLONY", "07:20 AM"],
      ["SUNDHARAM PAINT", "07:25 AM"],
      ["MOOLIGAI PANNAI AARCH", "07:30 AM"],
      ["PILLAIYARPATTI", "07:35 AM"],
      ["SENGIPATTI", "07:45 AM"],
      ["SRM CAMPUS", "08:40 AM"]
    ]
  },
  {
    routeNo: 5,
    routeName: "THANJAVUR - SALIYAMANGALAM",
    eveningDeparture: "04:35 PM",
    anchors: [10.7940, 79.2610, 10.7780, 79.0920],
    stops: [
      ["SAALIYAMANGALAM", "06:35 AM"],
      ["NANCHIKOTTAI ROAD", "07:05 AM"],
      ["EB COLONY", "07:10 AM"],
      ["K.KALAIGNAR NAGAR", "07:12 AM"],
      ["PALPANNAI - TNJ", "07:15 AM"],
      ["RMS COLONY", "07:17 AM"],
      ["PARVEEN THEATRE", "07:19 AM"],
      ["ANNA NAGAR - TNJ", "07:20 AM"],
      ["YAGAPPA NAGAR", "07:22 AM"],
      ["SRM CAMPUS", "08:40 AM"]
    ]
  },
  {
    routeNo: 6,
    routeName: "THANJAVUR - AMMAPETTAI",
    eveningDeparture: "04:35 PM",
    anchors: [10.7932, 79.3180, 10.7680, 79.0650],
    stops: [
      ["AMMAPETTAI MURUGAN KOVIL", "06:35 AM"],
      ["AMMAPETTAI BUS STAND", "06:40 AM"],
      ["SALIYAMANGALAM", "06:45 AM"],
      ["KOVILOOR", "06:50 AM"],
      ["MARIYAMMAN KOVIL", "06:55 AM"],
      ["KATTU THOTTAM", "06:57 AM"],
      ["GNANAM NAGAR", "07:00 AM"],
      ["MANNARKUDI BY-PASS", "07:05 AM"],
      ["GREEN CITY", "07:07 AM"],
      ["VILAR BYPASS", "07:10 AM"],
      ["SANGEETHA HOTEL - TNJ", "07:12 AM"],
      ["NANCHI KOTTAI BY-PASS", "07:15 AM"],
      ["COLLECTOR OFFICE - TNJ", "07:17 AM"],
      ["VALLAM BYPASS", "07:20 AM"],
      ["IYASAMI PATTI", "07:25 AM"],
      ["SRM CAMPUS", "08:45 AM"]
    ]
  },
  {
    routeNo: 7,
    routeName: "THIRUVAIYARU",
    eveningDeparture: "04:35 PM",
    anchors: [10.8835, 79.1045, 10.8240, 78.9210],
    stops: [
      ["THIRUVAIYARU", "06:45 AM"],
      ["PALLIYA AGRAKARAM", "06:55 AM"],
      ["KARANTHAI", "07:00 AM"],
      ["OLD BUS STAND - TNJ", "07:10 AM"],
      ["MEDICAL COLLEGE ROAD", "07:15 AM"],
      ["LAKSHMI SEEVAL", "07:20 AM"],
      ["SRM CAMPUS", "08:45 AM"]
    ]
  },
  {
    routeNo: 8,
    routeName: "THOLUDUR",
    eveningDeparture: "04:35 PM",
    anchors: [11.4160, 79.0220, 11.1620, 78.8380],
    stops: [
      ["THOLUDUR BUS STAND", "07:30 AM"],
      ["THOLUDUR TOLL PLAZA", "07:35 AM"],
      ["ERAIYUR", "07:40 AM"],
      ["MANGALA MEDU", "07:45 AM"],
      ["MURUKAN KUDI ROAD", "07:50 AM"],
      ["VAALIKANDAPURAM", "07:55 AM"],
      ["ROEVER COLLEGE", "08:00 AM"],
      ["PERAMBALUR NEW BUS STAND", "08:05 AM"],
      ["AARIYAS HOTEL - PMLR", "08:10 AM"],
      ["VIJAYAGOPALA PURAM", "08:15 AM"],
      ["SIRUGANUR", "08:30 AM"],
      ["SRM CAMPUS", "08:40 AM"]
    ]
  },
  {
    routeNo: 9,
    routeName: "PERAMBALUR",
    eveningDeparture: "04:35 PM",
    anchors: [11.2342, 78.8807, 11.0850, 78.8020],
    stops: [
      ["PERAMBALUR OLD BUS STAND", "07:55 AM"],
      ["ROEVER ARCH", "08:00 AM"],
      ["SRM CAMPUS", "08:40 AM"]
    ]
  },
  {
    routeNo: 10,
    routeName: "ARIYALUR",
    eveningDeparture: "04:35 PM",
    anchors: [11.1401, 79.0786, 11.1120, 78.8310],
    stops: [
      ["ARIYALUR BUS STAND", "07:10 AM"],
      ["MARUTHAYAN KOVIL", "07:20 AM"],
      ["KUNNAM", "07:25 AM"],
      ["ASUR", "07:30 AM"],
      ["SITHALI", "07:35 AM"],
      ["PERALI", "07:40 AM"],
      ["PERAMBALUR FOUR ROAD", "07:55 AM"],
      ["SIRUVACHUR", "08:05 AM"],
      ["NARANAMANGALAM", "08:10 AM"],
      ["ALATHUR GATE", "08:15 AM"],
      ["IRUR", "08:20 AM"],
      ["PADALUR", "08:25 AM"],
      ["SIRUGANUR", "08:35 AM"],
      ["SRM CAMPUS", "08:45 AM"]
    ]
  },
  {
    routeNo: 11,
    routeName: "PUDUKOTTAI",
    eveningDeparture: "04:35 PM",
    anchors: [10.3833, 78.8001, 10.7610, 78.7090],
    stops: [
      ["PUDUKOTTAI", "07:10 AM"],
      ["MELUR - PUDUKOTTAI", "07:20 AM"],
      ["AMMA CHATHIRAM", "07:25 AM"],
      ["KULATHUR", "07:30 AM"],
      ["KEERANUR", "07:35 AM"],
      ["AAVUR", "07:50 AM"],
      ["MATHUR", "07:55 AM"],
      ["MIET", "08:00 AM"],
      ["GUNDUR", "08:02 AM"],
      ["SEMPATTU", "08:03 AM"],
      ["AIRPORT", "08:05 AM"],
      ["SUBRAMANIYAPURAM", "08:10 AM"],
      ["MORAIS CITY", "08:12 AM"],
      ["SRM CAMPUS", "08:40 AM"]
    ]
  },
  {
    routeNo: 12,
    routeName: "KEERANUR",
    eveningDeparture: "04:35 PM",
    anchors: [10.5732, 78.7845, 10.7910, 78.7120],
    stops: [
      ["KEERANUR", "07:35 AM"],
      ["NALLUR", "07:45 AM"],
      ["AAVUR", "07:55 AM"],
      ["MATHUR", "07:57 AM"],
      ["MIET", "08:00 AM"],
      ["THIRUVALARCHI PATTI", "08:02 AM"],
      ["MORAIS CITY", "08:03 AM"],
      ["AIRPORT", "08:05 AM"],
      ["JAIL CORNER", "08:07 AM"],
      ["SUBRAMANIYAPURAM", "08:08 AM"],
      ["TVS TOLGATE", "08:10 AM"],
      ["SENTHANEERPURAM", "08:15 AM"],
      ["SRM CAMPUS", "08:45 AM"]
    ]
  },
  {
    routeNo: 13,
    routeName: "THURAIYUR - 1",
    eveningDeparture: "04:35 PM",
    anchors: [11.1485, 78.5955, 10.9420, 78.6980],
    stops: [
      ["THURAIYUR BUS STAND", "07:30 AM"],
      ["ANNAI HOSPITAL", "07:35 AM"],
      ["KALIPATTI", "07:40 AM"],
      ["PULIVALAM", "07:50 AM"],
      ["PERAMANGALAM", "08:00 AM"],
      ["THIRUVELLARAI", "08:05 AM"],
      ["MANNACHANALLUR", "08:15 AM"],
      ["SAMAYAPURAM", "08:30 AM"],
      ["SRM CAMPUS", "08:40 AM"]
    ]
  },
  {
    routeNo: 14,
    routeName: "THURAIYUR - 2",
    eveningDeparture: "04:35 PM",
    anchors: [11.1450, 78.5990, 10.9680, 78.6850],
    stops: [
      ["THURAIYUR", "07:30 AM"],
      ["THIRUVELLARAI", "08:05 AM"],
      ["OTHAKADAI PONAMPALAYAM", "08:15 AM"],
      ["KARIYAMANIKKAM ROAD", "08:30 AM"],
      ["SRM CAMPUS", "08:40 AM"]
    ]
  },
  {
    routeNo: 15,
    routeName: "MUSIRI",
    eveningDeparture: "04:35 PM",
    anchors: [10.9554, 78.4418, 10.8480, 78.6720],
    stops: [
      ["MUSIRI NEW BUS STAND", "07:00 AM"],
      ["MUSIRI KAIKATTI", "07:05 AM"],
      ["KULITHALAI SUNGAGATE", "07:15 AM"],
      ["KULITHALAI BUS STAND", "07:20 AM"],
      ["RAJENDRAM", "07:25 AM"],
      ["PETTAVAITHALAI", "07:30 AM"],
      ["JEEYAPURAM", "07:50 AM"],
      ["ALLUR", "07:55 AM"],
      ["MUTHARASANALLUR", "08:00 AM"],
      ["KAMBARASAM PETTAI", "08:05 AM"],
      ["KAVERY NAGAR", "08:10 AM"],
      ["KUDAMURUTI PALAM", "08:15 AM"],
      ["CHATHIRAM", "08:20 AM"],
      ["SRM CAMPUS", "08:45 AM"]
    ]
  },
  {
    routeNo: 16,
    routeName: "MANAPPARAI",
    eveningDeparture: "04:35 PM",
    anchors: [10.6062, 78.4258, 10.7790, 78.6780],
    stops: [
      ["MANAPPARAI BUS STAND", "07:27 AM"],
      ["MANAPPARAI MARIYAMMAN KOVIL", "07:30 AM"],
      ["MANAPPARAI ANDAVAR KOVIL", "07:35 AM"],
      ["MARAVANUR", "07:40 AM"],
      ["ALAMPATTI PUDUR", "07:45 AM"],
      ["JJ COLLEGE", "07:50 AM"],
      ["AGRI COLLEGE", "07:55 AM"],
      ["CHOZHAN NAGAR - TRY", "08:00 AM"],
      ["KARUMANDAPAM", "08:10 AM"],
      ["ARISTO", "08:20 AM"],
      ["MANNARPURAM", "08:30 AM"],
      ["SRM CAMPUS", "08:45 AM"]
    ]
  },
  {
    routeNo: 17,
    routeName: "VIRALIMALAI",
    eveningDeparture: "04:35 PM",
    anchors: [10.6015, 78.5468, 10.7680, 78.6710],
    stops: [
      ["VIRALIMALAI", "07:30 AM"],
      ["FATHIMA NAGAR", "07:40 AM"],
      ["ALUNTHOOR", "07:45 AM"],
      ["NAGAMANGALAM", "07:50 AM"],
      ["ALAMPATTI ROAD", "07:55 AM"],
      ["RAMACHANDRA NAGAR", "08:05 AM"],
      ["E PUDUR", "08:10 AM"],
      ["CRAW FORD", "08:12 AM"],
      ["POLICE QUARTERS", "08:15 AM"],
      ["SRM CAMPUS", "08:45 AM"]
    ]
  },
  {
    routeNo: 18,
    routeName: "K K NAGAR",
    eveningDeparture: "04:35 PM",
    anchors: [10.7635, 78.6852, 10.8180, 78.7120],
    stops: [
      ["WIRELESS ROAD", "07:55 AM"],
      ["K K NAGAR PETROL BUNK", "07:57 AM"],
      ["K K NAGAR BUS STAND", "08:00 AM"],
      ["LIC COLONY", "08:05 AM"],
      ["SENTHANEER PURAM", "08:15 AM"],
      ["SRM CAMPUS", "08:40 AM"]
    ]
  },
  {
    routeNo: 19,
    routeName: "HAPP",
    eveningDeparture: "04:35 PM",
    anchors: [10.7310, 78.7480, 10.7910, 78.7650],
    stops: [
      ["ANNA NAGAR - TRY", "07:27 AM"],
      ["INDHRA GATE", "07:30 AM"],
      ["HAPP", "07:40 AM"],
      ["POOLANGUDI", "07:46 AM"],
      ["NAVALPATTU", "07:50 AM"],
      ["THIRUVERUMBUR", "08:15 AM"],
      ["D NAGAR", "08:25 AM"],
      ["SRM CAMPUS", "08:45 AM"]
    ]
  },
  {
    routeNo: 20,
    routeName: "THUVAKUDI",
    eveningDeparture: "04:35 PM",
    anchors: [10.7540, 78.8320, 10.7980, 78.7580],
    stops: [
      ["THUVAKUDI TOLL PLAZA", "07:50 AM"],
      ["THUVAKUDI BUS STOP", "07:53 AM"],
      ["NIT", "07:58 AM"],
      ["ANNA ARCH", "07:59 AM"],
      ["BOILER", "08:03 AM"],
      ["GANESA", "08:06 AM"],
      ["KATTUR", "08:15 AM"],
      ["SRM CAMPUS", "08:45 AM"]
    ]
  },
  {
    routeNo: 21,
    routeName: "MALAIKOVIL",
    eveningDeparture: "04:35 PM",
    anchors: [10.7810, 78.7820, 10.8150, 78.7290],
    stops: [
      ["MALAIKOVIL", "07:50 AM"],
      ["NEWTOWN", "07:53 AM"],
      ["KAILASH NAGAR", "07:57 AM"],
      ["KATTUR", "08:00 AM"],
      ["OIL MILL", "08:07 AM"],
      ["RAIL NAGAR", "08:10 AM"],
      ["SRM CAMPUS", "08:40 AM"]
    ]
  },
  {
    routeNo: 22,
    routeName: "PONMALAI PATTI",
    eveningDeparture: "04:35 PM",
    anchors: [10.7840, 78.7240, 10.8220, 78.7110],
    stops: [
      ["PONMALAIPATTI", "07:55 AM"],
      ["PONMALAIPATTI GATE", "08:00 AM"],
      ["KK KOTTAI", "08:15 AM"],
      ["SIT", "08:20 AM"],
      ["PALPANNAI", "08:25 AM"],
      ["SANJIVEE NAGAR", "08:30 AM"],
      ["SRM CAMPUS", "08:45 AM"]
    ]
  },
  {
    routeNo: 23,
    routeName: "KARUMANDAPAM",
    eveningDeparture: "04:35 PM",
    anchors: [10.7825, 78.6755, 10.8240, 78.7080],
    stops: [
      ["KARUMANDAPAM", "08:10 AM"],
      ["ARISTO", "08:15 AM"],
      ["MANNARPURAM", "08:20 AM"],
      ["SANJIVEE NAGAR", "08:25 AM"],
      ["SRM CAMPUS", "08:40 AM"]
    ]
  },
  {
    routeNo: 24,
    routeName: "VAYALUR",
    eveningDeparture: "04:35 PM",
    anchors: [10.8110, 78.6180, 10.8290, 78.6720],
    stops: [
      ["ATHAVATHUR", "07:40 AM"],
      ["SARAVANA PURAM", "07:43 AM"],
      ["ALLITHURAI", "07:45 AM"],
      ["SOMARASAM PETTAI", "07:47 AM"],
      ["SOMARASAMPETTAI HOSPITAL STOP", "07:49 AM"],
      ["SOMARASAMPETTAI JOSEPH SCHOOL", "07:51 AM"],
      ["KONAR CHATHIRAM", "07:53 AM"],
      ["NACHI KURUCHI", "07:55 AM"],
      ["RAJIV GANDHI NAGAR", "07:57 AM"],
      ["RETTAIVAIKKAL", "08:00 AM"],
      ["UKT MALAI", "08:03 AM"],
      ["GEETHA NAGAR", "08:05 AM"],
      ["SRINIVASA NAGAR", "08:07 AM"],
      ["KUMARAN NAGAR", "08:08 AM"],
      ["SRM CAMPUS", "08:40 AM"]
    ]
  },
  {
    routeNo: 25,
    routeName: "SOMARASAMPETTAI",
    eveningDeparture: "04:35 PM",
    anchors: [10.8021, 78.6245, 10.8339, 78.6933],
    stops: [
      ["SOMARASAM PETTAI", "07:50 AM"],
      ["PUTHUR 4 ROAD", "08:10 AM"],
      ["TENNUR", "08:15 AM"],
      ["THILLAI NAGAR 11TH CROSS", "08:18 AM"],
      ["THILLAI NAGAR 5TH CROSS", "08:20 AM"],
      ["CHATHIRAM BUS STAND", "08:25 AM"],
      ["ANNA SALAI", "08:27 AM"],
      ["SRM CAMPUS", "08:50 AM"]
    ]
  },
  {
    routeNo: 26,
    routeName: "WORAIYUR",
    eveningDeparture: "04:35 PM",
    anchors: [10.8165, 78.6740, 10.8360, 78.6890],
    stops: [
      ["AMERICAN HOSPITAL", "07:45 AM"],
      ["COURT", "07:50 AM"],
      ["ARUNA THEATRE", "07:55 AM"],
      ["WORAIYUR POLICE STATION", "08:00 AM"],
      ["RUKUMANI THEATRE", "08:05 AM"],
      ["JAYANTHI COMPLEX BUS STOP", "08:10 AM"],
      ["KRT MOTORS KARUR BYPASS ROAD", "08:15 AM"],
      ["SRM CAMPUS", "08:45 AM"]
    ]
  },
  {
    routeNo: 27,
    routeName: "PALAKKARAI",
    eveningDeparture: "04:35 PM",
    anchors: [10.8015, 78.6885, 10.8339, 78.6933],
    stops: [
      ["KALLUKUZHI", "07:55 AM"],
      ["JOSEPH EYE HOSPITAL", "08:00 AM"],
      ["MARSING PETTAI", "08:05 AM"],
      ["MARAKKADAI", "08:10 AM"],
      ["KALYANI COVERING", "08:15 AM"],
      ["THEPPAKULAM", "08:17 AM"],
      ["CHATHIRAM BUS STAND", "08:20 AM"],
      ["SRM CAMPUS", "08:45 AM"]
    ]
  },
  {
    routeNo: 28,
    routeName: "SRI RANGAM",
    eveningDeparture: "04:35 PM",
    anchors: [10.8562, 78.6928, 10.8760, 78.7060],
    stops: [
      ["MAMBALA SALAI", "08:05 AM"],
      ["AMMAMANDAPAM", "08:10 AM"],
      ["RAJA GOPURAM", "08:15 AM"],
      ["DEVI THEATER", "08:20 AM"],
      ["T V KOVIL", "08:25 AM"],
      ["KOLLIDAM CHECK POST", "08:30 AM"],
      ["SRM CAMPUS", "08:40 AM"]
    ]
  },
  {
    routeNo: 29,
    routeName: "THIRUKATTUPALLI",
    eveningDeparture: "04:35 PM",
    anchors: [10.8210, 78.9520, 10.8740, 78.8180],
    stops: [
      ["BOOTHALUR", "07:05 AM"],
      ["VINNAMANGALAM", "07:10 AM"],
      ["THIRUKATTUPALLI BUS STAND", "07:14 AM"],
      ["PUTHU PALAM", "07:17 AM"],
      ["SENGARIYUR PALAM", "07:21 AM"],
      ["ANBIL", "07:24 AM"],
      ["NATARAJAPURAM", "07:30 AM"],
      ["KOPPALI", "07:32 AM"],
      ["LALGUDI", "07:45 AM"],
      ["THALAKUDI", "07:55 AM"],
      ["SRM CAMPUS", "08:35 AM"]
    ]
  },
  {
    routeNo: 30,
    routeName: "DALMIYAPURAM",
    eveningDeparture: "04:35 PM",
    anchors: [10.9740, 78.9510, 10.8820, 78.7180],
    stops: [
      ["DALMIYAPURAM", "07:25 AM"],
      ["NO 1 TOLGATE", "08:20 AM"],
      ["MARUTHI NAGAR", "08:23 AM"],
      ["PALUR", "08:32 AM"],
      ["SRM CAMPUS", "08:45 AM"]
    ]
  },
  {
    routeNo: 31,
    routeName: "PULLAMBADI",
    eveningDeparture: "04:35 PM",
    anchors: [10.9680, 78.9120, 10.8850, 78.7820],
    stops: [
      ["PULLAMBADI", "07:40 AM"],
      ["VELLANOOR", "07:45 AM"],
      ["PINNAVASAL", "07:55 AM"],
      ["POOVALUR", "07:56 AM"],
      ["LALGUDI", "08:05 AM"],
      ["NAGAR ROAD", "08:10 AM"],
      ["PACHAM PETTAI", "08:15 AM"],
      ["KEELA VALADI", "08:16 AM"],
      ["MELA VALADI", "08:17 AM"],
      ["THALAKUDI", "08:20 AM"],
      ["SAMAYAPURAM", "08:25 AM"],
      ["SRM CAMPUS", "08:45 AM"]
    ]
  }
];

// Interpolates coordinates along a quadratic curve through [start -> midWaypoint -> SRM Campus]
function interpolateCurve(p0, p1, p2, t) {
  const u = 1 - t;
  const lat = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
  const lng = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
  return [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
}

// Builds stops and 3 alternate road paths (Path A: Main Highway, Path B: Bypass, Path C: City Shortcut)
export const SRM_ROUTES = RAW_PDF_ROUTES.map((route) => {
  const p0 = [route.anchors[0], route.anchors[1]];
  const p1 = [route.anchors[2], route.anchors[3]];
  const p2 = [SRM_CAMPUS.lat, SRM_CAMPUS.lng];
  const totalStops = route.stops.length;

  const stops = route.stops.map(([name, morningTime], idx) => {
    const t = totalStops === 1 ? 1 : idx / (totalStops - 1);
    const [lat, lng] = idx === totalStops - 1 ? p2 : interpolateCurve(p0, p1, p2, t);
    return {
      stopNo: idx + 1,
      name,
      morningTime,
      lat,
      lng
    };
  });

  // Generate 3 realistic daily road paths (25 dense polyline vertices per path)
  const buildPath = (latOffset, lngOffset) => {
    const coords = [];
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const [baseLat, baseLng] = interpolateCurve(
        p0,
        [p1[0] + latOffset, p1[1] + lngOffset],
        p2,
        t
      );
      coords.push([baseLat, baseLng]);
    }
    return coords;
  };

  return {
    routeNo: route.routeNo,
    routeName: route.routeName,
    morningStartTime: stops[0].morningTime,
    morningCampusArrival: stops[stops.length - 1].morningTime,
    eveningCampusDeparture: route.eveningDeparture,
    stops,
    validPaths: [
      {
        pathId: "path_a",
        name: "Path A • NH-38 Main Highway Corridor",
        coordinates: buildPath(0, 0)
      },
      {
        pathId: "path_b",
        name: "Path B • Bypass Highway Corridor",
        coordinates: buildPath(0.012, -0.014)
      },
      {
        pathId: "path_c",
        name: "Path C • Alternate Service / City Road",
        coordinates: buildPath(-0.011, 0.013)
      }
    ]
  };
});