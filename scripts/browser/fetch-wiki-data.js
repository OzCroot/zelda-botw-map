// Run this in the browser DevTools console while on any www.zeldadungeon.net page (so requests are same-origin and
// carry your already-solved Cloudflare session). It downloads one JSON file with:
//   Phase 1  shrines: each shrine's wiki "summary" (blessing, requirements, recommendations, shrine quest, treasure,
//            enemies), one request per shrine.
//   Phase 2  everything else: each page's short description (pageprops), in batches of 50 titles per request.
//
// - Requests are sequential with a pause between them.
// - It stops immediately if the site answers 403/429 or shows a challenge page; it never retries through one.
// - Progress is kept in localStorage, so if it stops you can paste it again and it carries on where it left off.
// - Please check the site's terms before using the data anywhere public.
(async () => {
  const SHRINES = ["Akh Va'quot Shrine","Bareeda Naag Shrine","Bosh Kala Shrine","Chaas Qeta Shrine","Daag Chokah Shrine","Dagah Keek Shrine","Dah Hesho Shrine","Dah Kaso Shrine","Daka Tuss Shrine","Dako Tah Shrine","Daqa Koh Shrine","Daqo Chisay Shrine","Dila Maag Shrine","Dow Na'eh Shrine","Dunba Taag Shrine","Etsu Korima Shrine (DLC)","Gee Ha'rah Shrine","Goma Asaagh Shrine","Gorae Torr Shrine","Ha Dahamar Shrine","Hawa Koth Shrine","Hia Miu Shrine","Hila Rao Shrine","Ishto Soh Shrine","Ja Baij Shrine","Jee Noh Shrine","Jitan Sa'mi Shrine","Joloo Nah Shrine","Ka'o Makagh Shrine","Kaam Ya'tak Shrine","Kah Mael Shrine","Kah Okeo Shrine","Kah Yah Shrine","Kam Urog Shrine","Kamia Omuna Shrine (DLC)","Katah Chuki Shrine","Katosa Aug Shrine","Kay Noh Shrine","Kaya Wan Shrine","Kayra Mah Shrine","Ke'nai Shakah Shrine","Kee Dafunia Shrine (DLC)","Keeha Yoog Shrine","Keh Namut Shrine","Keive Tala Shrine (DLC)","Kema Kosassa Shrine","Kema Zoos Shrine","Keo Ruug Shrine","Ketoh Wawai Shrine","Kiah Toza Shrine (DLC)","Kihiro Moh Shrine (DLC)","Korgu Chideh Shrine","Korsh O'hu Shrine","Kuh Takkar Shrine","Kuhn Sidajj Shrine","Lakna Rokee Shrine","Lanno Kooh Shrine","Maag Halan Shrine","Maag No'rah Shrine","Mah Eliya Shrine (DLC)","Maka Rah Shrine","Mezza Lo Shrine","Mijah Rokee Shrine","Mirro Shaz Shrine","Misae Suma Shrine","Mo'a Keet Shrine","Mogg Latan Shrine","Monya Toma Shrine","Mozo Shenno Shrine","Muwo Jeem Shrine","Myahm Agana Shrine","Namika Ozz Shrine","Ne'ez Yohma Shrine","Noe Rajee Shrine (DLC)","Noya Neha Shrine","Oman Au Shrine","Owa Daim Shrine","Pumaag Nitae Shrine","Qaza Tokki Shrine","Qua Raym Shrine","Qukah Nata Shrine","Raqa Zunzo Shrine","Ree Dahee Shrine","Rin Oyaa Shrine","Rinu Honika Shrine (DLC)","Ritaag Zumo Shrine","Rohta Chigah Shrine (DLC)","Rok Uwog Shrine","Rona Kachta Shrine","Rota Ooh Shrine","Rucco Maag Shrine","Ruvo Korbah Shrine (DLC)","Saas Ko'sah Shrine","Sah Dahaj Shrine","Sasa Kai Shrine","Sato Koda Shrine (DLC)","Sha Gehma Shrine","Sha Warvo Shrine","Shada Naw Shrine","Shae Katha Shrine","Shae Loya Shrine","Shae Mo'sah Shrine","Shai Utoh Shrine","Shai Yota Shrine","Sharo Lun Shrine (DLC)","Shee Vaneer Shrine","Shee Venath Shrine","Sheem Dagoze Shrine","Sheh Rata Shrine","Shira Gomar Shrine (DLC)","Sho Dantu Shrine","Shoda Sah Shrine","Shoqa Tatone Shrine","Shora Hah Shrine","Shrine of Resurrection","Soh Kofi Shrine","Suma Sahma Shrine","Ta'loh Naeg Shrine","Tah Muhl Shrine","Tahno O'ah Shrine","Takama Shiri Shrine (DLC)","Tawa Jinn Shrine","Tena Ko'sah Shrine","Tho Kayu Shrine","To Quomo Shrine","Toh Yahsa Shrine","Toto Sah Shrine","Tu Ka'loh Shrine","Tutsuwa Nima Shrine","Voo Lota Shrine","Wahgo Katta Shrine","Ya Naga Shrine","Yah Rin Shrine","Yowaka Ita Shrine (DLC)","Zalta Wa Shrine","Ze Kasho Shrine","Zuna Kai Shrine"];
  const NAMES = ["A Brother's Roast","A Fragmented Monument","A Freezing Rod","A Gift for My Beloved","A Gift for the Great Fairy","A Gift from the Monks","A Gift of Nightshade","A Landscape of a Stable","A Parent's Love","A Rare Find","A Royal Recipe","A Shady Customer","A Song of Storms","A Wife Washed Away","Abandoned North Mine","Afromsia Coast","Akkala Ancient Tech Lab","Akkala Bridge Ruins","Akkala Citadel Ruins","Akkala Falls","Akkala Parade Ground Ruins","Akkala Span","Akkala Tower","Akkala Wilds","Aldor Foothills","Amber","Amber (glitched)","An Ice Guy","Ancient Arrow","Ancient Arrow x3","Ancient Arrow x5","Ancient Bridle (DLC)","Ancient Columns","Ancient Core","Ancient Saddle (DLC)","Ancient Shaft","Ancient Tree Stump","Angel Peak","Ankel Island","Applean Forest","Aquame Bridge","Aquame Lake","Arbiter's Grounds","Aris Beach","Arrow x10","Arrow x5","Arrows of Burning Heat","Ash Swamp","Atun Valley","Balloon Flight","Bank of Wishes","Bannan Island","Barula Plain","Batrea Lake","Big Twin Bridge","Birida Lookout","Biron Snowshelf","Black Hinox","Blatchery Plain","Blizzard Rod","Blizzard Rod (Master Mode)","Bloodleaf Lake","Blue Hinox","Blue-Maned Lynel (Crusher)","Blue-Maned Lynel (Spear)","Blue-Maned Lynel (Sword)","Bomb Arrow","Bomb Arrow x10","Bomb Arrow x5","Bomb Arrow x5 (DLC)","Bomb Arrow x5 (dog treasure)","Boné Pond","Boneyard Bridge","Bonooru's Stand","Boomerang","Boomerang (Master Mode)","Bottomless Swamp","Boulder Breaker","Brazen Beak","Breach of Demise","Breman Peak","Bridge of Eldin","Bridge of Hylia","Broca Island","Bronas Forest","Brynna Plain","Bubinga Forest","By Firefly's Light","Calora Lake","Camphor Pond","Cap of the Wild","Cape Cales","Cape Cresia","Captured Memories","Carok Bridge","Castle Town Prison","Castle Town Watchtower","Central Square","Central Tower","Cephla Lake","Champion's Gate","Clarnet Coast","Cliffs of Quince","Cliffs of Ruvara","Cliffside Etchings","Cobble Crusher","Coldsnap Hollow","Coliseum Ruins","Cooking Pot","Cooking with Koko","Cora Lake","Coral Reef","Corta Lake","Corvash Peak","Courage Steppe","Crenel Hills","Crenel Peak","Cuho Mountain","Curry for What Ails You","Dalite Forest","Damel Forest","Darb Pond","Darunia Lake","Darybon Plains","Daval Peak","Davdi Island","Daybreaker","Death Caldera","Death Mountain's Secret","Decayed Guardian","Deepback Bay","Demon Carver (Master Mode)","Deplian Badlands","Destroy Ganon","Deya Lake","Deya Village Ruins","Diamond","Diamond (Master Mode)","Diamond Circlet","Digdogg Suspension Bridge","Dining Hall","Dinraal's Scale","Divine Beast Vah Medoh","Divine Beast Vah Naboris","Divine Beast Vah Rudania","Divine Beast Vah Ruta","Diving is Beauty!","Docks","Double Axe","Double Axe (Master Mode)","Dracozu Lake","Dracozu River","Dragon Bone Mire","Dragon's Exile","Drenan Highlands","Drillshaft","Drillshaft (Master Mode)","Dronoc's Pass","Dueling Peaks","Dueling Peaks Stable","Dueling Peaks Tower","Dunsel Plateau","Duplex Bow (Master Mode)","Eagus Bridge","East Akkala Beach","East Akkala Plains","East Akkala Stable","East Barrens","East Castle Town","East Deplian Badlands","East Gerudo Mesa","East Gerudo Ruins","East Passage","East Post Ruins","East Reservoir Lake","East Sokkala Bridge","East Wind","Eastern Abbey","Ebara Forest","Ebon Mountain","Edge of Duality","Edge of Duality (Master Mode)","Eightfold Blade","Eightfold Longblade","Eightfold Longblade (Master Mode)","Eldin Great Skeleton","Eldin Tower","Eldin's Flank","Elma Knolls","Emblazoned Shield","Enchanted","Eventide Island","EX Ancient Horse Rumors","EX Champion Daruk's Song","EX Champion Mipha's Song","EX Champion Revali's Song","EX Champion Urbosa's Song","EX Champions' Ballad","EX Recovered Memory #1 - Champion Revali's Song","EX Recovered Memory #2 - Champion Daruk's Song","EX Recovered Memory #3 - Champion Mipha's Song","EX Recovered Memory #4 - Champion Urbosa's Song","EX Recovered Memory #5 - The Champions' Ballad","EX Royal Guard Rumors","EX Strange Mask Rumors","EX Teleportation Rumors","EX Treasure: Ancient Mask","EX Treasure: Dark Armor","EX Treasure: Fairy Clothes","EX Treasure: Garb of Winds","EX Treasure: Merchant Hood","EX Treasure: Phantasma","EX Treasure: Twilight Relic","EX Treasure: Usurper King","EX Trial of the Sword","Exchange Ruins","Face the Frost Talus","Falcon Bow","Falcon Bow (Master Mode)","Fang and Bone","Faron Tower","Faron Woods","Farosh Hills","Fashion Passion","Feathered Edge","Feathered Edge (Master Mode)","Feathered Spear","Feathered Spear (dog treasure)","Feathered Spear (Master Mode)","Find Kheel","Find the Fairy Fountain","Finra Woods","Fir River","Fire Arrow x10","Fire Arrow x5","Fire Rod (Master Mode)","Fireproof Lizard Roundup","Firly Plateau","Firly Pond","First Gatehouse","Fisherman's Shield","Fishing Harpoon","Fishing Resort","Flameblade","Flameblade (Master Mode)","Flamespear","Flamespear (Master Mode)","Flight Range","Flint","Floret Sandbar","Floria Bridge","Floria Falls","Floria River","Flown the Coop","Follow the Sheikah Slate","Foothill Stable","Footrace Check-In","Forbidden City Entry","Forest Dweller's Bow","Forest Dweller's Bow (Master Mode)","Forest Dweller's Shield","Forest Dweller's Shield (Master Mode)","Forest Dweller's Spear","Forest Dweller's Spear (dog treasure)","Forest Dweller's Spear (Master Mode)","Forest Dweller's Sword","Forest Dweller's Sword (Master Mode)","Forest of Spirits","Forest of Time","Forgotten Temple","Fort Hateno","Free the Divine Beasts","Frog Catching","From the Ground Up","Frost Talus","Frostblade","Frostblade (Master Mode)","Frostspear (Master Mode)","Fural Plain","Gama Cove","Gambling mini-game","Gatepost Town Ruins","General Shoppe","General Store","Gero Pond","Gerudo Canyon","Gerudo Canyon Pass","Gerudo Canyon Stable","Gerudo Desert Gateway","Gerudo Great Skeleton","Gerudo Scimitar","Gerudo Scimitar (Master Mode)","Gerudo Shield","Gerudo Shield (Master Mode)","Gerudo Spear","Gerudo Spear (Master Mode)","Gerudo Summit","Gerudo Tower","Gerudo Town","Giant Ancient Core","Giant Boomerang","Giant Boomerang (Master Mode)","Giant's Forest","Ginner Woods","Gisa Crater","Gleeok Bridge","Goddess Statue","Goflam's Secret Hot Spring","Gogobi Shores","Gold Rupee","Gold Rupee (dog treasure)","Golden Bow","Golden Bow (Master Mode)","Golden Claymore","Golden Claymore (Master Mode)","Golow River","Good-Sized Horse","Goponga Island","Goponga Village Ruins","Gorko Lake","Gorko Tunnel","Goro Cove","Goron City","Goron Gusto Shop","Goron Hot Springs","Goronbi Lake","Goronbi River","Gortram Cliff","Great Cliffs","Great Deku Tree's Navel","Great Eagle Bow","Great Fairy Cotera","Great Fairy Fountain","Great Fairy Kaysa","Great Fairy Mija","Great Fairy Tera","Great Flameblade (Master Mode)","Great Frostblade (Master Mode)","Great Plateau","Great Plateau Tower","Great Thunderblade","Great Thunderblade (Master Mode)","Great Zora Bridge","Grinnden Plains","Guardian Skywatcher","Guardian Slideshow","Guardian Stalker","Guardian Turret","Guards' Chamber","Guchini Plain","Guchini Plain Barrows","Gut Check Rock","Hanu Pond","Haran Lake","Harfin Valley","Harker Lake","Hateno Ancient Tech Lab","Hateno Bay","Hateno Beach","Hateno Tower","Hateno Village","Hebra East Summit","Hebra Falls","Hebra Great Skeleton","Hebra Headspring","Hebra North Crest","Hebra North Summit","Hebra Peak","Hebra Plunge","Hebra South Summit","Hebra Tower","Hebra Trailhead Lodge","Hebra Tundra","Hebra West Summit","Helmhead Bridge","Hemaar's Descent","Herin Lake","Hestu's Maracas","Hickaly Woods","High Spirits Produce","Highland Stable","Hills of Baumer","Hinox","Hinox (Middle Kin)","Hinox (Oldest Kin)","Hinox (Youngest Kin)","Hobbies of the Rich","Hopper Pond","Horon Lagoon","Horse God Bridge","Horse God Malanya","Horwell Bridge","Hotel Oasis","Hunt for the Giant Horse","Hunter's Shield","Hylia Island","Hylia River","Hylian Homeowner","Hylian Shield","Hylian Trousers","Hyrule Castle","Hyrule Castle Moat","Hyrule Castle Town Ruins","Hyrule Cathedral","Hyrule Forest Park","Hyrule Garrison Ruins","Ibara Butte","Ice Arrow","Ice Arrow x10","Ice Arrow x10 (dog treasure)","Ice Arrow x5","Ice Rod","Ice Rod (Master Mode)","Icefall Foothills","Igneo Talus","Illumeni Plateau","Inn","Inogo Bridge","Into the Vortex","Irch Plain","Iron Sledgehammer","Iron Sledgehammer (Master Mode)","Island Lobster Shirt (DLC)","Isle of Rabac","Ja'Abu Ridge","Jeddo Bridge","Jia Highlands","Kaepora Pass","Kakariko Bridge","Kakariko Village","Kamah Plateau","Kanalet Ridge","Kara Kara Bazaar","Karusa Valley","Keelay Plain","Keya Pond","Kincean Island","King's Study","Kitano Bay","Kite Shield","Kite Shield (Master Mode)","Knight's Bow","Knight's Bow (dog treasure)","Knight's Bow (Master Mode)","Knight's Broadsword","Knight's Broadsword (Master Mode)","Knight's Claymore","Knight's Claymore (dog treasure)","Knight's Claymore (Master Mode)","Knight's Halberd","Knight's Halberd (Master Mode)","Knight's Shield","Knight's Shield (glitched)","Knight's Shield (Master Mode)","Knuckel Island","Kochi Dye Shop","Koholit Rock","Koko Cuisine","Koko's Kitchen","Koko's Specialty","Kolami Bridge","Kolomo Garrison Ruins","Komo Shoreline","Kopeeki Drifts","Korne Beach","Korok Forest","Korok Leaf","Korok Mask (DLC)","Koto Pond","Koukot Plateau","Lake Akkala","Lake Darman","Lake Ferona","Lake Floria","Lake Hylia","Lake Illumeni","Lake Intenoch","Lake Jarrah","Lake Kilsie","Lake Kolomo","Lake Mekar","Lake of the Horse God","Lake Saria","Lake Siela","Lake Sumac","Lake Totori","Lake Tower","Lakeside Stable","Lanayru Bay","Lanayru Bluff","Lanayru Heights","Lanayru Promenade","Lanayru Range","Lanayru Road - East Gate","Lanayru Road - West Gate","Lanayru Tower","Lantern Lake","Laparoh Mesa","Laverra Beach","Legendary Rabbit Trial","Leviathan Bones","Library","Lightning Rod (Master Mode)","Lightscale Trident","Lindor's Brow","Linebeck Island","Little Sister's Big Request","Little Twin Bridge","Locked Mementos","Lockup","Lodrum Headland","Lomei Labyrinth Island","Lorn's Fruit Stand","Loshlo Harbor","Lost Woods","Ludfo's Bog","Lulu Lake","Luminous Stone","Luminous Stone Gathering","Lurelin Village","Luto's Crossing","Lynel (Crusher)","Lynel (Spear)","Lynel (Sword)","Lynel Safari","Mabe Prairie","Mabe Village Ruins","Mable Ridge","Madorna Mountain","Majora's Mask (DLC)","Malanya Spring","Malin Bay","Manhala Bridge","Mapla Point","Marblod Plain","Maritta Exchange Ruins","Martha's Landing","Master of the Wind","Maw of Death Mountain","Meadela's Mantle","Meda Mountain","Medicinal Molduga","Medingo Pool","Mekar Island","Menoat River","Mercay Island","Meteor Rod","Meteor Rod (Master Mode)","Midla Woods","Midna's Helmet (DLC)","Mido Swamp","Mighty Bananas","Mikau Lake","Military Training Camp","Millennio Sandbar","Minshi Woods","Misko, the Great Bandit","Missing in Action","Moat Bridge","Molduga","Molida Island","Moonlight Scimitar","Moonlight Scimitar (Master Mode)","Moor Garrison Ruins","Mount Agaat","Mount Daphnes","Mount Drena","Mount Dunsel","Mount Faloraa","Mount Floria","Mount Granajh","Mount Gustaf","Mount Hylia","Mount Nabooru","Mount Rhoam","Mount Rozudo","Mount Taran","Mounted Archery Camp","My Hero","Mystathi's Shelf","N. Tabantha Snowfield","Nabi Lake","Nautelle Wetlands","Naydra Snowfield","Naydra's Scale","Nephra Hill","Nero Hill","Nette Plateau","Nima Plain","Nintendo Switch Shirt (DLC)","Nirvata Lake","Nirvata Plateau","North Akkala Beach","North Akkala Foothill","North Akkala Valley","North Hyrule Plain","North Lomei Labyrinth","Northern Icehouse","Oakle's Navel","Observation Room","Obtain the Master Sword","Old Shirt","Opal","Opal (dog treasure)","Opal (glitched)","Opal (Master Mode)","Ordorac Quarry","Ore and More","Oren Bridge","Orsedd Bridge","Oseira Plains","Outpost Ruins","Outskirt Stable","Ovli Plain","Owlan Bridge","Pagos Woods","Palmorae Beach","Palmorae Ruins","Palu Wasteland","Pappetto Grove","Parache Plains","Passer Hill","Passeri Greenbelt","Peak of Awakening","Phalian Highlands","Phantom Armor (DLC)","Phantom Ganon Armor (DLC)","Phantom Ganon Greaves (DLC)","Phantom Ganon Skull (DLC)","Phantom Greaves (DLC)","Phantom Helmet (DLC)","Phrenic Bow","Phrenic Bow (Master Mode)","Pico Pond","Pierre Plateau","Pikida Stonegrove","Pillars of Levia","Piper Ridge","Playtime with Cottla","Ploymus Mountain","Pondo's Lodge","Popla Foothills","Princess Zelda's Room","Princess Zelda's Study","Protein Palace","Proxim Bridge","Puffer Beach","Purifier Lake","Purple Rupee","Purple Rupee (glitched)","Quarry Ruins","Quatta's Shelf","Rabella Wetlands","Rabia Plain","Radiant Shield","Radiant Shield (Master Mode)","Raft","Ralis Pond","Ranch Ruins","Rassla Lake","Rauru Hillside","Rauru Settlement Ruins","Ravio's Hood (DLC)","Rayne Highlands","Reach Zora's Domain","Rebonae Bridge","Recital at Warbler's Nest","Recovered Memory #1 - Subdued Ceremony (Picture 1)","Recovered Memory #10 - Mipha's Touch","Recovered Memory #11 - Shelter from the Storm (Picture 7)","Recovered Memory #12 - Father and Daughter (Picture 8)","Recovered Memory #13 - Slumbering Power (Picture 9)","Recovered Memory #14 - To Mount Lanayru (Picture 10)","Recovered Memory #15 - Return of Calamity Ganon (Picture 11)","Recovered Memory #16 - Despair (Picture 12)","Recovered Memory #17 - Zelda's Awakening (Picture 13)","Recovered Memory #18 - The Master Sword","Recovered Memory #2 - Revali's Flap","Recovered Memory #3 - Resolve and Grief (Picture 2)","Recovered Memory #4 - Daruk's Mettle","Recovered Memory #5 - Zelda's Resentment (Picture 3)","Recovered Memory #6 - Urbosa's Hand","Recovered Memory #7 - Blades of the Yiga (Picture 4)","Recovered Memory #8 - A Premonition (Picture 5)","Recovered Memory #9 - Silent Princess (Picture 6)","Red Rupee","Regencia River","Retsam Forest","Rhondson Armor Boutique","Riddles of Hyrule","Ridgeland Tower","Rikoka Hills","Rimba Beach","Riola Spring","Ripped and Shredded","Risoka Snowfield","Rist Peninsula","Rito Stable","Rito Village","River of the Dead","Riverbed Reward","Riverside Stable","Robbie's Research","Robred Dropoff","Rodai Lake","Rok Woods","Rollin' Inn","Romani Plains","Rospro Pass","Rowan Plain","Royal Ancient Lab Ruins","Royal Bow (Master Mode)","Royal Broadsword","Royal Broadsword (Master Mode)","Royal Claymore","Royal Claymore (Master Mode)","Royal Guard Boots (DLC)","Royal Guard Cap (DLC)","Royal Guard Uniform (DLC)","Royal Guard's Bow (Master Mode)","Royal Guard's Claymore (Master Mode)","Royal Guard's Shield (Master Mode)","Royal Guard's Spear","Royal Guard's Spear (Master Mode)","Royal Guard's Sword (Master Mode)","Royal Halberd","Royal Halberd (Master Mode)","Royal Shield","Royal Shield (Master Mode)","Ruby","Ruby (DLC)","Ruby (Master Mode)","Rushroom Rush!","Rutala Dam","Rutala River","Rutile Lake","Rutimala Hill","Ruto Lake","Ruto Mountain","Ruto Precipice","S. Tabantha Snowfield","Sacred Ground Ruins","Safula Hill","Sage Temple Ruins","Sahasra Slope","Salari Hill","Salari Plain","Salvager Headwear","Salvager Trousers","Salvager Vest","Samasa Plain","Sanctum","Sand-Seal Rally","Sanidin Park Ruins","Sapphia's Table","Sapphire","Sapphire (Master Mode)","Sarjon Bridge","Sarjon Woods","Satori Mountain","Savage Lynel Shield","Scimitar of the Seven","Scout's Hill","Seabed Inn","Second Gatehouse","Secret of the Cedars","Secret of the Snowy Peaks","Seek Out Impa","Selmie's Spot","Serenne Stable","Seres Scablands","Serpentine Spear","Serpentine Spear (Master Mode)","Shadow Hamlet Ruins","Shadow Pass","Shard of Dinraal's Fang","Shard of Farosh's Fang","Shard of Naydra's Fang","Shatterback Point","Sherfin's Secret Hot Spring","Shield of the Mind's Eye (Master Mode)","Shock Arrow x10","Shock Arrow x10 (dog treasure)","Shock Arrow x5","Shrine Island","Shrouded Shrine","Shuteye Inn","Sign of the Shadow","Silver Bow","Silver Bow (Master Mode)","Silver Longsword","Silver Longsword (Master Mode)","Silver Lynel (Sword)","Silver Rupee","Silver Rupee (dog treasure)","Silver Shield","Silver Shield (Master Mode)","Silverscale Spear","Silverscale Spear (Master Mode)","Skull Lake","Slated for Upgrades","Slippery Falcon","Slippery Falcon (Tarrey Town Branch)","Snowfield Stable","Soka Point","Sokkala Bridge","Soldier's Bow","Soldier's Bow (glitched)","Soldier's Bow (Master Mode)","Soldier's Broadsword","Soldier's Broadsword (Master Mode)","Soldier's Claymore","Soldier's Claymore (Master Mode)","Soldier's Shield","Soldier's Shield (Master Mode)","Soldier's Spear","Soldier's Spear (Master Mode)","Solewood Range","South Akkala Plains","South Akkala Stable","South Lake Akkala","South Lomei Labyrinth","South Nabi Lake","Southern Mine","Southern Oasis","Special Delivery","Spectacle Rock","Spiked Boko Bow","Spool Bight","Spore Store","Spring of Courage","Spring of Power","Spring of Wisdom","Squabble River","Stalhorse: Pictured!","Stalnox","Stalry Plateau","Star Fragment","Star Fragment (dog treasure)","Starlight Memories","Statue of the Eighth Heroine","Stinger Cliffs","Stolock Bridge","Stone Smasher","Stone Smasher (Master Mode)","Stone Talus","Stone Talus (Junior)","Stone Talus (Luminous)","Stone Talus (Rare)","Stone Talus (Senior)","Stranded on Eventide","Strock Lake","Sturnida Basin","Sturnida Secret Hot Spring","Sunken Treasure","Sunshroom Sensing","Swallow Bow","Swallow Bow (Master Mode)","Swallow's Roost","Taafei Hill","Tabahl Woods","Tabantha Bridge Stable","Tabantha Great Bridge","Tabantha Hills","Tabantha Tower","Tabantha Village Ruins","Take Back the Sea","Tal Tal Peak","Talonto Peak","Talus Plateau","Tama Pond","Tamio River","Tanagar Canyon","Tanagar Canyon Course","Taobab Grassland","Taran Pass","Tarm Point","Tarrey Town","Telta Lake","Tempest Gulch","Temple of Time","Temto Hill","Tenoko Island","Ternio Trail","Test of Will","The Ancient Rito Song","The Apple of My Eye","The Bird in the Mountains","The Ceremonial Song","The Crowned Beast","The Curious Quiver","The Cursed Statue","The Desert Labyrinth","The Eighth Heroine","The Eye of the Sandstorm","The Forgotten Sword","The Giant of Ralis Pond","The Great Ton Pu Inn","The Gut Check Challenge","The Hero's Cache","The Hero's Sword","The Horseback Hoodlums","The Isolated Plateau","The Jewel Trade","The Korok Trials","The Lost Pilgrimage","The Mystery Polluter","The Perfect Drink","The Priceless Maracas","The Road to Respect","The Royal Guard's Gear","The Royal White Stallion","The Search for Barta","The Secret Club's Secret","The Serpent's Jaws","The Seven Heroines","The Sheep Rustlers","The Silent Swordswomen","The Skull's Eye","The Spark of Romance","The Spring of Power","The Spring of Wisdom","The Statue's Bargain","The Stolen Heirloom","The Test of Wood","The Three Giant Brothers","The Thunder Helm","The Two Rings","The Undefeated Champ","The Weapon Connoisseur","Thims Bridge","Throwing Spear","Throwing Spear (Master Mode)","Thunder Helm","Thunder Magnet","Thunderblade","Thunderblade (Master Mode)","Thunderspear (Master Mode)","Thunderstorm Rod","Thunderstorm Rod (Master Mode)","Thundra Plateau","Thyphlo Ruins","Tingel Island","Tingle's Hood (DLC)","Tingle's Shirt (DLC)","Tingle's Tights (DLC)","Tobio's Hollow","Tools of the Trade","Topaz","Topaz (Master Mode)","Torin Wetland","Toronbo Beach","Toruma Dunes","Toto Lake","Travel Medallion (DLC)","Traveler's Bow","Traveler's Sword","Trial of Second Sight","Trial of the Labyrinth","Trial of Thunder","Trial on the Cliff","Trilby Plain","Trilby Valley","Trotter's Downfall","Trousers of the Wild","Tuft Mountain","Tumlea Heights","Tunic of the Wild","Ubota Point","Ukuku Plains","Ulri Mountain","Ulria Grotto","Under a Red Moon","Upland Lindor","Upland Zorana","Uten Marsh","Vatorsa Snowfield","Veiled Falls","Ventest Clothing Boutique","Vicious Sickle (Master Mode)","Walnot Mountain","Warbler's Nest","Warm Doublet","Washa's Bluff","Wasteland Tower","Watch Out for the Flowers","Water Reservoir","Well-Worn Trousers","Wes Island","West Barrens","West Castle Town","West Deplian Badlands","West Gerudo Ruins","West Hyrule Plains","West Passage","West Sokkala Bridge","Wetland Stable","What's for Dinner?","Whistling Hill","White-Maned Lynel (Crusher)","White-Maned Lynel (Spear)","White-Maned Lynel (Sword)","Wild Horses","Windcleaver (Master Mode)","Windvane Meadow","Wintre Island","Woodland Stable","Woodland Tower","Yambi Lake","Yarna Valley","Yiga Clan Hideout","Zant's Helmet (DLC)","Zauz Island","Zelkoa Pond","Zelo Pond","Zirco Mesa","Zodobon Highlands","Zokassa Ridge","Zonai Ruins","Zora Helm","Zora River","Zora Spear","Zora Spear (Master Mode)","Zora Stone Monuments","Zora Sword (Master Mode)","Zora's Domain"];
  const DELAY_MS = 2500; // pause between requests (plus up to 1s of jitter)
  const CACHE_KEY = "zd-wiki-v1";

  // <helpers>
  // Turns the shrine summary HTML into { blessing, requirements: { text, links }, ... }. The HTML is a single <p> of
  // "<b>Label:</b> value" runs separated by <br>, led by an italic blessing name.
  const parseSummary = (html) => {
    const p = new DOMParser().parseFromString(html, "text/html").querySelector("p");
    if (!p) return null;
    const out = {};
    const blessing = p.querySelector(":scope > i");
    if (blessing) out.blessing = blessing.textContent.trim();

    const camel = (label) =>
      label.replace(/:\s*$/, "").trim().split(/\s+/).map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w.toLowerCase())).join("");
    const linkOf = (el) => ({
      name: el.textContent.trim(),
      page: el.dataset.target || decodeURIComponent((el.getAttribute("href") || "").replace(/^\/wiki\//, "")).replace(/_/g, " "),
    });

    let key = null;
    let text = "";
    let links = [];
    const flush = () => {
      if (!key) return;
      out[key] = { text: text.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n"), links };
      key = null;
      text = "";
      links = [];
    };
    for (const node of p.childNodes) {
      if (node.nodeType === 1 && node.tagName === "B") {
        flush();
        key = camel(node.textContent);
      } else if (key) {
        if (node.nodeType === 1 && node.tagName === "BR") text += "\n";
        else {
          text += node.textContent;
          if (node.nodeType === 1) {
            const found = node.matches("a, .internal-link") ? [node] : [...node.querySelectorAll("a, .internal-link")];
            links.push(...found.map(linkOf));
          }
        }
      }
    }
    flush();
    return out;
  };

  // Marker names are not always wiki titles: "Fire Arrow x10", "Stone Talus (Junior)", "Gold Rupee (dog treasure)".
  const cleanTitle = (name) => name.replace(/\s+x\d+$/i, "").replace(/\s*\([^)]*\)$/, "").trim();
  // Titles to look up for a marker name: the name itself first, then the cleaned-up form if that differs.
  const candidates = (name) => [...new Set([name, cleanTitle(name)])].filter(Boolean);

  // Reads a batched pageprops response into { [requestedTitle]: { description } | { missing: true } }, following the
  // API's title normalisation and redirects so each answer is filed under the title that was asked for.
  const readDescriptions = (json, titles) => {
    const q = (json && json.query) || {};
    const normalized = new Map((q.normalized || []).map((n) => [n.from, n.to]));
    const redirects = new Map((q.redirects || []).map((r) => [r.from, r.to]));
    const byTitle = new Map(Object.values(q.pages || {}).map((pg) => [pg.title, pg]));
    const out = {};
    for (const t of titles) {
      let title = normalized.get(t) || t;
      title = redirects.get(title) || title;
      const pg = byTitle.get(title);
      if (!pg || "missing" in pg || "invalid" in pg) out[t] = { missing: true };
      else out[t] = { description: (pg.pageprops && pg.pageprops.description) || null, ...(title !== t ? { page: title } : {}) };
    }
    return out;
  };
  // </helpers>

  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  cache.shrines ||= {};
  cache.titles ||= {};
  // Reuse shrine summaries saved by the earlier shrines-only version of this script, so they are not fetched again.
  // (Entries that had no summary are left out so they get another try.)
  const earlier = JSON.parse(localStorage.getItem("zd-shrine-summaries-v1") || "{}");
  for (const [name, entry] of Object.entries(earlier)) if (!entry.missing && !cache.shrines[name]) cache.shrines[name] = entry;
  const save = () => localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let stopped = null;

  // Returns parsed JSON, or null after recording why we stopped (blocked, challenged, offline).
  const get = async (url) => {
    try {
      const res = await fetch(url, { credentials: "same-origin", headers: { Accept: "application/json" } });
      if (res.status === 403 || res.status === 429 || !(res.headers.get("content-type") || "").includes("json")) {
        stopped = "Blocked or challenged (HTTP " + res.status + "). Stopping so we do not hammer the site. Reload the page, make sure you can browse normally, then paste the script again to resume.";
        return null;
      }
      return await res.json();
    } catch (e) {
      stopped = "Network error: " + e.message;
      return null;
    }
  };
  const pause = () => sleep(DELAY_MS + Math.random() * 1000);

  // ---- Phase 1: shrines ------------------------------------------------------------------------------------------
  const summaryUrl = (name) => {
    // Our data tags DLC shrines "(DLC)"; wiki page titles do not.
    const page = name.replace(/ \(DLC\)$/, "");
    const wikitext =
      "{{#vardefine:gsize|300}}{{#vardefine:galign|left}}{{#vardefine:gpad|0}}{{#vardefine:square|false}}" +
      "{{#lst:" + page + "|summary}}";
    const q = new URLSearchParams({ format: "json", action: "parse", prop: "text", contentmodel: "wikitext", text: wikitext });
    return "/wiki/api.php?" + q;
  };
  const shrinesTodo = SHRINES.filter((n) => !cache.shrines[n]);
  console.log("Phase 1: %d shrines, %d to fetch (~%d min)", SHRINES.length, shrinesTodo.length, Math.ceil((shrinesTodo.length * (DELAY_MS + 500)) / 60000));
  for (const [i, name] of shrinesTodo.entries()) {
    const json = await get(summaryUrl(name));
    if (!json) break;
    const html = json.parse && json.parse.text && json.parse.text["*"];
    const parsed = html ? parseSummary(html) : null;
    cache.shrines[name] = parsed && Object.keys(parsed).length
      ? { ...parsed, html, fetchedAt: new Date().toISOString() }
      : { missing: true, html: html || null, error: json.error && json.error.info, fetchedAt: new Date().toISOString() };
    save();
    console.log("[%d/%d] %s%s", i + 1, shrinesTodo.length, name, cache.shrines[name].missing ? "  (no summary found)" : "");
    await pause();
  }

  // ---- Phase 2: descriptions for everything else, 50 titles per request ----------------------------------------
  if (!stopped) {
    const titles = [...new Set(NAMES.flatMap(candidates))].filter((t) => !cache.titles[t]);
    const batches = [];
    for (let i = 0; i < titles.length; i += 50) batches.push(titles.slice(i, i + 50));
    console.log("Phase 2: %d titles in %d requests", titles.length, batches.length);
    for (const [i, batch] of batches.entries()) {
      // pageprops can be split across continuation requests; gather the pieces before reading the result.
      const merged = { query: { pages: {}, normalized: [], redirects: [] } };
      let cont = {};
      do {
        const q = new URLSearchParams({ format: "json", action: "query", prop: "pageprops", ppprop: "description", redirects: "1", titles: batch.join("|"), ...cont });
        const json = await get("/wiki/api.php?" + q);
        if (!json) break;
        for (const [id, pg] of Object.entries((json.query && json.query.pages) || {}))
          merged.query.pages[id] = { ...merged.query.pages[id], ...pg, pageprops: { ...(merged.query.pages[id] || {}).pageprops, ...pg.pageprops } };
        merged.query.normalized.push(...((json.query && json.query.normalized) || []));
        merged.query.redirects.push(...((json.query && json.query.redirects) || []));
        cont = json.continue || null;
        if (cont) await pause();
      } while (cont);
      if (stopped) break;
      Object.assign(cache.titles, readDescriptions(merged, batch));
      save();
      console.log("[%d/%d] %d titles", i + 1, batches.length, batch.length);
      await pause();
    }
  }

  if (stopped) console.warn(stopped);
  const shrinesOk = SHRINES.filter((n) => cache.shrines[n] && !cache.shrines[n].missing).length;
  const found = Object.values(cache.titles).filter((t) => t.description).length;
  console.log("Shrines: %d of %d with a summary. Titles: %d looked up, %d with a description.", shrinesOk, SHRINES.length, Object.keys(cache.titles).length, found);

  // Marker name -> the titles to try for it, so the importer does not have to repeat the clean-up rules.
  const names = Object.fromEntries(NAMES.map((n) => [n, candidates(n)]));
  const out = { shrines: cache.shrines, titles: cache.titles, names, fetchedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "zeldadungeon-data.json" });
  a.click();
  window.__zd = out;
})();
