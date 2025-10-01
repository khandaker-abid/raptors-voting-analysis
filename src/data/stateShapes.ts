// Enhanced state boundary data with more realistic shapes
// These are stylized representations of state shapes

// Helper function to get county count for a state
export const getCountyCount = (stateName: string): number => {
	const stateShape = stateShapes[stateName];
	return stateShape?.counties?.length || 0;
};

export const stateShapes: Record<
	string,
	{
		path: string;
		viewBox: string;
		counties?: Array<{ name: string; path: string }>;
	}
> = {
	"Arkansas": {
		viewBox: "0 0 600 400",
		path: "M 50,120 L 80,90 L 120,85 L 180,80 L 240,85 L 300,82 L 360,88 L 420,95 L 480,110 L 520,130 L 545,160 L 550,200 L 548,240 L 540,280 L 525,310 L 500,335 L 460,350 L 400,355 L 340,352 L 280,355 L 220,350 L 160,345 L 100,330 L 70,300 L 55,260 L 50,220 L 48,180 L 50,140 Z",
		counties: [
			// Northwest Arkansas (12 counties)
			{
				name: "Benton",
				path: "M 50,120 L 120,85 L 140,140 L 100,160 L 60,150 L 50,120 Z",
			},
			{
				name: "Washington",
				path: "M 120,85 L 180,80 L 200,140 L 140,140 L 120,85 Z",
			},
			{
				name: "Carroll",
				path: "M 180,80 L 240,85 L 260,140 L 200,140 L 180,80 Z",
			},
			{
				name: "Boone",
				path: "M 240,85 L 300,82 L 320,140 L 260,140 L 240,85 Z",
			},
			{
				name: "Marion",
				path: "M 300,82 L 360,88 L 380,145 L 320,140 L 300,82 Z",
			},
			{
				name: "Fulton",
				path: "M 360,88 L 420,95 L 440,150 L 380,145 L 360,88 Z",
			},
			{
				name: "Sharp",
				path: "M 420,95 L 480,110 L 500,160 L 440,150 L 420,95 Z",
			},
			{
				name: "Randolph",
				path: "M 480,110 L 520,130 L 540,170 L 500,160 L 480,110 Z",
			},
			{
				name: "Madison",
				path: "M 60,160 L 100,160 L 120,200 L 80,210 L 60,160 Z",
			},
			{
				name: "Johnson",
				path: "M 100,160 L 140,140 L 160,180 L 120,200 L 100,160 Z",
			},
			{
				name: "Pope",
				path: "M 140,140 L 200,140 L 220,180 L 160,180 L 140,140 Z",
			},
			{
				name: "Conway",
				path: "M 200,140 L 260,140 L 280,180 L 220,180 L 200,140 Z",
			},

			// North Central Arkansas (12 counties)
			{
				name: "Izard",
				path: "M 60,210 L 100,200 L 120,240 L 80,250 L 60,210 Z",
			},
			{
				name: "Stone",
				path: "M 100,200 L 140,180 L 160,220 L 120,240 L 100,200 Z",
			},
			{
				name: "Cleburne",
				path: "M 140,180 L 200,180 L 220,220 L 160,220 L 140,180 Z",
			},
			{
				name: "Independence",
				path: "M 200,180 L 260,180 L 280,220 L 220,220 L 200,180 Z",
			},
			{
				name: "Jackson",
				path: "M 260,140 L 320,140 L 340,180 L 280,180 L 260,140 Z",
			},
			{
				name: "Poinsett",
				path: "M 320,140 L 380,145 L 400,185 L 340,180 L 320,140 Z",
			},
			{
				name: "Craighead",
				path: "M 380,145 L 440,150 L 460,190 L 400,185 L 380,145 Z",
			},
			{
				name: "Mississippi",
				path: "M 440,150 L 500,160 L 520,200 L 460,190 L 440,150 Z",
			},
			{
				name: "Clay",
				path: "M 500,160 L 540,170 L 550,200 L 520,200 L 500,160 Z",
			},
			{
				name: "Greene",
				path: "M 380,185 L 440,190 L 460,230 L 400,225 L 380,185 Z",
			},
			{
				name: "Lawrence",
				path: "M 340,180 L 380,185 L 400,225 L 360,220 L 340,180 Z",
			},
			{
				name: "Searcy",
				path: "M 320,180 L 360,185 L 380,225 L 340,220 L 320,180 Z",
			},

			// Northeast Arkansas (8 counties)
			{
				name: "Crittenden",
				path: "M 460,190 L 520,200 L 540,240 L 480,230 L 460,190 Z",
			},
			{
				name: "St. Francis",
				path: "M 480,230 L 540,240 L 550,280 L 490,270 L 480,230 Z",
			},
			{
				name: "Lee",
				path: "M 490,270 L 550,280 L 540,320 L 500,310 L 490,270 Z",
			},
			{
				name: "Phillips",
				path: "M 500,310 L 540,320 L 525,360 L 485,350 L 500,310 Z",
			},
			{
				name: "Monroe",
				path: "M 485,350 L 525,360 L 500,390 L 460,380 L 485,350 Z",
			},
			{
				name: "Arkansas",
				path: "M 460,380 L 500,390 L 480,420 L 440,410 L 460,380 Z",
			},
			{
				name: "Desha",
				path: "M 440,410 L 480,420 L 460,450 L 420,440 L 440,410 Z",
			},
			{
				name: "Chicot",
				path: "M 420,440 L 460,450 L 440,480 L 400,470 L 420,440 Z",
			},

			// West Central Arkansas (10 counties)
			{
				name: "Crawford",
				path: "M 80,250 L 120,240 L 140,280 L 100,290 L 80,250 Z",
			},
			{
				name: "Franklin",
				path: "M 120,240 L 160,220 L 180,260 L 140,280 L 120,240 Z",
			},
			{
				name: "Van Buren",
				path: "M 160,220 L 200,220 L 220,260 L 180,260 L 160,220 Z",
			},
			{
				name: "Faulkner",
				path: "M 200,220 L 240,220 L 260,260 L 220,260 L 200,220 Z",
			},
			{
				name: "White",
				path: "M 240,220 L 280,220 L 300,260 L 260,260 L 240,220 Z",
			},
			{
				name: "Woodruff",
				path: "M 280,220 L 320,220 L 340,260 L 300,260 L 280,220 Z",
			},
			{
				name: "Prairie",
				path: "M 320,220 L 360,220 L 380,260 L 340,260 L 320,220 Z",
			},
			{
				name: "Lonoke",
				path: "M 360,260 L 400,255 L 420,295 L 380,300 L 360,260 Z",
			},
			{
				name: "Pulaski",
				path: "M 220,260 L 260,260 L 280,300 L 240,300 L 220,260 Z",
			},
			{
				name: "Saline",
				path: "M 180,260 L 220,260 L 240,300 L 200,300 L 180,260 Z",
			},

			// Central Arkansas (8 counties)
			{
				name: "Garland",
				path: "M 140,280 L 180,260 L 200,300 L 160,320 L 140,280 Z",
			},
			{
				name: "Hot Spring",
				path: "M 160,320 L 200,300 L 240,340 L 200,360 L 160,320 Z",
			},
			{
				name: "Grant",
				path: "M 240,300 L 280,300 L 300,340 L 260,340 L 240,300 Z",
			},
			{
				name: "Jefferson",
				path: "M 280,300 L 320,300 L 340,340 L 300,340 L 280,300 Z",
			},
			{
				name: "Lincoln",
				path: "M 320,300 L 360,300 L 380,340 L 340,340 L 320,300 Z",
			},
			{
				name: "Drew",
				path: "M 380,340 L 420,335 L 440,375 L 400,380 L 380,340 Z",
			},
			{
				name: "Bradley",
				path: "M 340,340 L 380,340 L 400,380 L 360,385 L 340,340 Z",
			},
			{
				name: "Calhoun",
				path: "M 300,340 L 340,340 L 360,380 L 320,385 L 300,340 Z",
			},

			// Southwest Arkansas (12 counties)
			{
				name: "Scott",
				path: "M 100,290 L 140,280 L 160,320 L 120,330 L 100,290 Z",
			},
			{
				name: "Yell",
				path: "M 120,330 L 160,320 L 200,360 L 160,370 L 120,330 Z",
			},
			{
				name: "Perry",
				path: "M 200,360 L 240,340 L 280,380 L 240,390 L 200,360 Z",
			},
			{
				name: "Dallas",
				path: "M 260,340 L 300,340 L 320,385 L 280,390 L 260,340 Z",
			},
			{
				name: "Cleveland",
				path: "M 240,390 L 280,390 L 300,430 L 260,440 L 240,390 Z",
			},
			{
				name: "Montgomery",
				path: "M 160,370 L 200,360 L 240,400 L 200,410 L 160,370 Z",
			},
			{
				name: "Pike",
				path: "M 120,370 L 160,370 L 200,410 L 160,420 L 120,370 Z",
			},
			{
				name: "Clark",
				path: "M 200,410 L 240,400 L 280,440 L 240,450 L 200,410 Z",
			},
			{
				name: "Nevada",
				path: "M 120,420 L 160,420 L 200,460 L 160,470 L 120,420 Z",
			},
			{
				name: "Ouachita",
				path: "M 160,470 L 200,460 L 240,500 L 200,510 L 160,470 Z",
			},
			{
				name: "Hempstead",
				path: "M 80,460 L 120,450 L 160,490 L 120,500 L 80,460 Z",
			},
			{
				name: "Howard",
				path: "M 120,500 L 160,490 L 200,530 L 160,540 L 120,500 Z",
			},

			// Southeast Arkansas (10 counties)
			{
				name: "Ashley",
				path: "M 400,470 L 440,460 L 460,500 L 420,510 L 400,470 Z",
			},
			{
				name: "Union",
				path: "M 360,480 L 400,470 L 420,510 L 380,520 L 360,480 Z",
			},
			{
				name: "Columbia",
				path: "M 320,490 L 360,480 L 380,520 L 340,530 L 320,490 Z",
			},
			{
				name: "Lafayette",
				path: "M 280,500 L 320,490 L 340,530 L 300,540 L 280,500 Z",
			},
			{
				name: "Miller",
				path: "M 240,510 L 280,500 L 300,540 L 260,550 L 240,510 Z",
			},
			{
				name: "Little River",
				path: "M 200,520 L 240,510 L 260,550 L 220,560 L 200,520 Z",
			},
			{
				name: "Sevier",
				path: "M 160,530 L 200,520 L 220,560 L 180,570 L 160,530 Z",
			},
			{
				name: "Polk",
				path: "M 100,540 L 140,530 L 180,570 L 140,580 L 100,540 Z",
			},
			{
				name: "Sebastian",
				path: "M 80,320 L 120,310 L 140,350 L 100,360 L 80,320 Z",
			},

			// Additional counties to reach 75 total
			{
				name: "Baxter",
				path: "M 280,180 L 320,180 L 340,220 L 300,220 L 280,180 Z",
			},
			{
				name: "Cross",
				path: "M 340,260 L 380,260 L 400,300 L 360,300 L 340,260 Z",
			},
			{
				name: "Newton",
				path: "M 120,250 L 160,240 L 180,280 L 140,290 L 120,250 Z",
			},
			{
				name: "Logan",
				path: "M 140,290 L 180,280 L 200,320 L 160,330 L 140,290 Z",
			},
		],
	},
	"Rhode Island": {
		viewBox: "0 0 800 600",
		path: "M 300,100 L 400,90 L 500,120 L 550,180 L 560,250 L 555,320 L 540,380 L 500,430 L 450,460 L 400,470 L 350,465 L 300,450 L 250,420 L 220,380 L 200,330 L 195,280 L 200,230 L 210,180 L 230,130 L 260,105 L 300,100 Z",
		counties: [
			{
				name: "Providence",
				path: "M 300,100 L 400,90 L 420,180 L 350,200 L 280,180 L 260,130 L 300,100 Z",
			},
			{
				name: "Bristol",
				path: "M 420,180 L 500,120 L 550,180 L 520,240 L 450,250 L 420,180 Z",
			},
			{
				name: "Kent",
				path: "M 280,180 L 350,200 L 450,250 L 430,320 L 320,300 L 250,280 L 220,230 L 280,180 Z",
			},
			{
				name: "Newport",
				path: "M 430,320 L 520,240 L 560,250 L 555,320 L 520,360 L 450,350 L 430,320 Z",
			},
			{
				name: "Washington",
				path: "M 250,280 L 320,300 L 450,350 L 400,470 L 350,465 L 300,450 L 250,420 L 220,380 L 200,330 L 195,280 L 250,280 Z",
			},
		],
	},
	"West Virginia": {
		viewBox: "0 0 700 500",
		path: "M 180,60 L 240,40 L 300,35 L 360,38 L 420,45 L 480,55 L 540,70 L 580,90 L 610,120 L 630,160 L 635,200 L 632,240 L 625,280 L 630,320 L 620,360 L 600,390 L 560,410 L 520,420 L 480,425 L 420,422 L 360,425 L 300,420 L 240,415 L 180,400 L 140,380 L 100,350 L 80,310 L 75,270 L 78,230 L 75,190 L 85,150 L 110,110 L 145,80 L 180,60 Z",
		counties: [
			// Northern Panhandle (4 counties)
			{
				name: "Hancock",
				path: "M 180,60 L 220,50 L 230,100 L 190,110 L 180,80 L 180,60 Z",
			},
			{
				name: "Brooke",
				path: "M 220,50 L 260,45 L 270,95 L 230,100 L 220,50 Z",
			},
			{ name: "Ohio", path: "M 260,45 L 300,42 L 310,90 L 270,95 L 260,45 Z" },
			{
				name: "Marshall",
				path: "M 300,42 L 340,40 L 350,88 L 310,90 L 300,42 Z",
			},

			// North Central (8 counties)
			{
				name: "Wetzel",
				path: "M 340,40 L 380,42 L 390,90 L 350,88 L 340,40 Z",
			},
			{
				name: "Monongalia",
				path: "M 380,42 L 420,45 L 430,95 L 390,90 L 380,42 Z",
			},
			{
				name: "Preston",
				path: "M 420,45 L 480,55 L 490,105 L 430,95 L 420,45 Z",
			},
			{
				name: "Marion",
				path: "M 190,110 L 230,100 L 240,150 L 200,160 L 190,110 Z",
			},
			{
				name: "Harrison",
				path: "M 230,100 L 270,95 L 280,145 L 240,150 L 230,100 Z",
			},
			{
				name: "Taylor",
				path: "M 270,95 L 310,90 L 320,140 L 280,145 L 270,95 Z",
			},
			{
				name: "Barbour",
				path: "M 310,90 L 350,88 L 360,138 L 320,140 L 310,90 Z",
			},
			{
				name: "Tucker",
				path: "M 350,88 L 390,90 L 400,140 L 360,138 L 350,88 Z",
			},

			// Eastern Panhandle (4 counties)
			{
				name: "Grant",
				path: "M 390,90 L 430,95 L 440,145 L 400,140 L 390,90 Z",
			},
			{
				name: "Mineral",
				path: "M 430,95 L 490,105 L 500,155 L 440,145 L 430,95 Z",
			},
			{
				name: "Hampshire",
				path: "M 500,155 L 540,170 L 550,220 L 500,205 L 500,155 Z",
			},
			{
				name: "Hardy",
				path: "M 440,145 L 500,155 L 510,205 L 450,195 L 440,145 Z",
			},

			// West Central (10 counties)
			{
				name: "Doddridge",
				path: "M 200,160 L 240,150 L 250,200 L 210,210 L 200,160 Z",
			},
			{
				name: "Ritchie",
				path: "M 240,150 L 280,145 L 290,195 L 250,200 L 240,150 Z",
			},
			{
				name: "Lewis",
				path: "M 280,145 L 320,140 L 330,190 L 290,195 L 280,145 Z",
			},
			{
				name: "Upshur",
				path: "M 320,140 L 360,138 L 370,188 L 330,190 L 320,140 Z",
			},
			{
				name: "Randolph",
				path: "M 360,138 L 400,140 L 410,190 L 370,188 L 360,138 Z",
			},
			{
				name: "Pendleton",
				path: "M 400,140 L 450,145 L 460,195 L 410,190 L 400,140 Z",
			},
			{
				name: "Gilmer",
				path: "M 210,210 L 250,200 L 260,250 L 220,260 L 210,210 Z",
			},
			{
				name: "Braxton",
				path: "M 250,200 L 290,195 L 300,245 L 260,250 L 250,200 Z",
			},
			{
				name: "Webster",
				path: "M 290,195 L 330,190 L 340,240 L 300,245 L 290,195 Z",
			},
			{
				name: "Pocahontas",
				path: "M 330,190 L 370,188 L 380,238 L 340,240 L 330,190 Z",
			},

			// Central (8 counties)
			{
				name: "Wirt",
				path: "M 150,210 L 190,200 L 200,250 L 160,260 L 150,210 Z",
			},
			{
				name: "Calhoun",
				path: "M 190,200 L 230,195 L 240,245 L 200,250 L 190,200 Z",
			},
			{
				name: "Clay",
				path: "M 220,260 L 260,250 L 270,300 L 230,310 L 220,260 Z",
			},
			{
				name: "Nicholas",
				path: "M 260,250 L 300,245 L 310,295 L 270,300 L 260,250 Z",
			},
			{
				name: "Greenbrier",
				path: "M 300,245 L 340,240 L 350,290 L 310,295 L 300,245 Z",
			},
			{
				name: "Fayette",
				path: "M 230,310 L 270,300 L 280,350 L 240,360 L 230,310 Z",
			},
			{
				name: "Raleigh",
				path: "M 270,300 L 310,295 L 320,345 L 280,350 L 270,300 Z",
			},
			{
				name: "Summers",
				path: "M 310,295 L 350,290 L 360,340 L 320,345 L 310,295 Z",
			},

			// Southwest (8 counties)
			{
				name: "Wood",
				path: "M 110,240 L 150,230 L 160,280 L 120,290 L 110,240 Z",
			},
			{
				name: "Pleasants",
				path: "M 150,230 L 190,220 L 200,270 L 160,280 L 150,230 Z",
			},
			{
				name: "Tyler",
				path: "M 120,290 L 160,280 L 170,330 L 130,340 L 120,290 Z",
			},
			{
				name: "Roane",
				path: "M 160,280 L 200,270 L 210,320 L 170,330 L 160,280 Z",
			},
			{
				name: "Jackson",
				path: "M 130,340 L 170,330 L 180,380 L 140,390 L 130,340 Z",
			},
			{
				name: "Mason",
				path: "M 100,380 L 140,370 L 150,420 L 110,430 L 100,380 Z",
			},
			{
				name: "Putnam",
				path: "M 170,330 L 210,320 L 220,370 L 180,380 L 170,330 Z",
			},
			{
				name: "Kanawha",
				path: "M 180,380 L 220,370 L 230,420 L 190,430 L 180,380 Z",
			},

			// Southern (8 counties)
			{
				name: "Cabell",
				path: "M 110,430 L 150,420 L 160,470 L 120,480 L 110,430 Z",
			},
			{
				name: "Wayne",
				path: "M 120,480 L 160,470 L 170,520 L 130,530 L 120,480 Z",
			},
			{
				name: "Lincoln",
				path: "M 150,420 L 190,410 L 200,460 L 160,470 L 150,420 Z",
			},
			{
				name: "Boone",
				path: "M 190,430 L 230,420 L 240,470 L 200,480 L 190,430 Z",
			},
			{
				name: "Logan",
				path: "M 200,480 L 240,470 L 250,520 L 210,530 L 200,480 Z",
			},
			{
				name: "Mingo",
				path: "M 210,530 L 250,520 L 260,570 L 220,580 L 210,530 Z",
			},
			{
				name: "Wyoming",
				path: "M 240,470 L 280,460 L 290,510 L 250,520 L 240,470 Z",
			},
			{
				name: "McDowell",
				path: "M 250,520 L 290,510 L 300,560 L 260,570 L 250,520 Z",
			},

			// Southeast (4 counties) - corrected to include only WV counties
			{
				name: "Mercer",
				path: "M 320,345 L 360,340 L 370,390 L 330,395 L 320,345 Z",
			},
			{
				name: "Monroe",
				path: "M 360,340 L 400,335 L 410,385 L 370,390 L 360,340 Z",
			},

			// Additional counties to reach 55 total
			{
				name: "Jefferson",
				path: "M 500,205 L 550,220 L 560,270 L 510,255 L 500,205 Z",
			},
			{
				name: "Berkeley",
				path: "M 450,195 L 500,205 L 510,255 L 460,245 L 450,195 Z",
			},
			{
				name: "Morgan",
				path: "M 410,190 L 450,195 L 460,245 L 420,240 L 410,190 Z",
			},
		],
	},
	// Add more state outlines for non-detail states
	"Alabama": {
		viewBox: "0 0 600 600",
		path: "M 150,50 L 200,45 L 250,48 L 300,52 L 350,58 L 400,65 L 450,75 L 500,90 L 530,120 L 545,160 L 550,200 L 548,250 L 545,300 L 540,350 L 530,400 L 515,440 L 490,470 L 450,490 L 400,500 L 350,505 L 300,500 L 250,495 L 200,485 L 150,470 L 110,440 L 85,400 L 70,350 L 65,300 L 68,250 L 75,200 L 85,150 L 100,110 L 125,80 L 150,50 Z",
	},
	"Alaska": {
		viewBox: "0 0 800 600",
		path: "M 100,200 L 150,180 L 200,170 L 250,175 L 300,185 L 350,200 L 400,220 L 450,245 L 500,275 L 530,310 L 540,350 L 535,390 L 520,420 L 490,440 L 450,450 L 400,445 L 350,440 L 300,435 L 250,430 L 200,420 L 150,400 L 110,370 L 85,330 L 75,290 L 80,250 L 90,220 L 100,200 Z",
	},
	"Arizona": {
		viewBox: "0 0 600 500",
		path: "M 100,100 L 500,100 L 500,150 L 480,200 L 470,250 L 480,300 L 500,350 L 500,400 L 100,400 L 100,350 L 120,300 L 130,250 L 120,200 L 100,150 L 100,100 Z",
	},
	"California": {
		viewBox: "0 0 500 800",
		path: "M 100,50 L 150,40 L 200,45 L 250,55 L 300,70 L 350,90 L 400,120 L 430,160 L 450,200 L 460,250 L 465,300 L 460,350 L 450,400 L 435,450 L 415,500 L 390,540 L 360,570 L 320,590 L 280,600 L 240,595 L 200,585 L 160,570 L 125,550 L 100,520 L 85,480 L 80,440 L 85,400 L 95,360 L 110,320 L 130,280 L 150,240 L 170,200 L 185,160 L 195,120 L 200,80 L 195,60 L 180,45 L 150,35 L 120,40 L 100,50 Z",
	},
	"Colorado": {
		viewBox: "0 0 600 400",
		path: "M 100,100 L 500,100 L 500,300 L 100,300 L 100,100 Z",
	},
	"Connecticut": {
		viewBox: "0 0 600 300",
		path: "M 100,100 L 200,95 L 300,100 L 400,110 L 500,125 L 520,150 L 510,180 L 480,200 L 420,210 L 360,205 L 300,200 L 240,195 L 180,185 L 120,170 L 85,150 L 80,125 L 90,105 L 100,100 Z",
	},
	"Delaware": {
		viewBox: "0 0 300 600",
		path: "M 150,50 L 200,55 L 220,80 L 230,120 L 225,160 L 220,200 L 215,240 L 210,280 L 205,320 L 200,360 L 190,400 L 175,440 L 155,470 L 130,485 L 100,490 L 80,480 L 70,460 L 75,440 L 85,420 L 100,400 L 115,380 L 125,360 L 130,340 L 135,320 L 140,300 L 145,280 L 150,260 L 155,240 L 160,220 L 165,200 L 170,180 L 175,160 L 180,140 L 185,120 L 185,100 L 180,80 L 170,65 L 155,55 L 150,50 Z",
	},
	"Florida": {
		viewBox: "0 0 700 500",
		path: "M 150,100 L 200,95 L 250,100 L 300,110 L 350,125 L 400,145 L 450,170 L 500,200 L 540,240 L 570,285 L 590,330 L 600,380 L 590,420 L 560,450 L 520,470 L 470,480 L 420,475 L 370,465 L 320,450 L 270,430 L 220,405 L 170,375 L 125,340 L 90,300 L 70,255 L 65,210 L 75,165 L 95,125 L 125,105 L 150,100 Z M 500,350 L 550,345 L 580,360 L 590,385 L 580,410 L 550,425 L 520,420 L 505,400 L 500,375 L 500,350 Z",
	},
	"Georgia": {
		viewBox: "0 0 500 600",
		path: "M 150,50 L 200,45 L 250,50 L 300,58 L 350,70 L 400,85 L 430,110 L 450,140 L 460,175 L 465,210 L 460,245 L 450,280 L 435,315 L 415,350 L 390,385 L 360,415 L 325,440 L 285,460 L 245,475 L 205,485 L 165,490 L 125,485 L 90,470 L 65,445 L 50,410 L 45,370 L 55,330 L 70,290 L 90,250 L 115,210 L 140,170 L 165,130 L 190,95 L 215,65 L 240,45 L 265,35 L 290,30 L 315,32 L 340,38 L 365,48 L 385,62 L 400,80 L 410,100 L 415,120 L 415,140 L 410,160 L 400,180 L 385,200 L 365,220 L 340,235 L 315,245 L 290,250 L 265,250 L 240,245 L 215,235 L 190,220 L 165,200 L 140,180 L 115,160 L 90,140 L 70,120 L 55,100 L 50,80 L 55,60 L 70,45 L 90,35 L 115,30 L 140,32 L 150,50 Z",
	},
	"Wyoming": {
		viewBox: "0 0 600 400",
		path: "M 85,80 L 515,82 L 516,84 L 517,86 L 518,315 L 516,317 L 514,318 L 88,320 L 86,318 L 84,316 L 83,82 L 85,80 Z",
	},
	"Montana": {
		viewBox: "0 0 700 400",
		path: "M 50,80 L 650,85 L 648,92 L 645,98 L 642,315 L 638,318 L 635,320 L 55,318 L 52,316 L 50,312 L 48,85 L 50,80 Z",
	},
	"North Dakota": {
		viewBox: "0 0 600 400",
		path: "M 85,85 L 515,88 L 516,90 L 517,92 L 518,315 L 516,317 L 514,318 L 88,320 L 86,318 L 84,316 L 83,88 L 85,85 Z",
	},
	"South Dakota": {
		viewBox: "0 0 600 400",
		path: "M 85,85 L 515,88 L 516,90 L 517,92 L 518,315 L 516,317 L 514,318 L 88,320 L 86,318 L 84,316 L 83,88 L 85,85 Z",
	},
	"Kansas": {
		viewBox: "0 0 600 400",
		path: "M 85,85 L 515,88 L 516,90 L 517,92 L 518,315 L 516,317 L 514,318 L 88,320 L 86,318 L 84,316 L 83,88 L 85,85 Z",
	},
	"Nebraska": {
		viewBox: "0 0 600 400",
		path: "M 85,85 L 515,88 L 516,90 L 517,92 L 518,315 L 516,317 L 514,318 L 88,320 L 86,318 L 84,316 L 83,88 L 85,85 Z",
	},
	"Utah": {
		viewBox: "0 0 450 600",
		path: "M 80,80 L 370,82 L 372,84 L 374,520 L 372,522 L 370,524 L 82,522 L 80,520 L 78,518 L 76,84 L 78,82 L 80,80 Z",
	},
	"Nevada": {
		viewBox: "0 0 400 600",
		path: "M 80,80 L 120,82 L 200,120 L 240,150 L 280,200 L 320,280 L 340,350 L 350,400 L 360,450 L 370,520 L 368,522 L 366,524 L 82,522 L 80,520 L 78,518 L 76,84 L 78,82 L 80,80 Z",
	},
};

// Default shape for states without specific data
export const defaultStateShape = {
	viewBox: "0 0 500 350",
	path: "M 50,50 L 450,50 L 450,300 L 50,300 Z",
	counties: [],
};

export const getStateShape = (stateName: string) => {
	return stateShapes[stateName] || defaultStateShape;
};
