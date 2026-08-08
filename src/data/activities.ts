import type { Interest } from './regions'

export interface Activity {
  id: string
  regionId: string
  name: string
  blurb: string
  hours: number
  yen: number
  tags: Interest[]
}

export const ACTIVITIES: Activity[] = [
  // Tokyo
  { id: 'tky-senso', regionId: 'tokyo', name: 'Senso-ji & Nakamise', blurb: "Tokyo's oldest temple and its snack-lined approach street.", hours: 2, yen: 0, tags: ['history', 'food'] },
  { id: 'tky-shibuya', regionId: 'tokyo', name: 'Shibuya Crossing & Sky', blurb: 'The world\'s busiest crossing, viewed from above at Shibuya Sky.', hours: 2, yen: 2200, tags: ['pop-culture', 'nightlife'] },
  { id: 'tky-tsukiji', regionId: 'tokyo', name: 'Tsukiji Outer Market breakfast', blurb: 'Fresh sushi and grilled skewers from stalls that open at dawn.', hours: 2, yen: 3500, tags: ['food'] },
  { id: 'tky-akihabara', regionId: 'tokyo', name: 'Akihabara arcades & anime shops', blurb: 'Retro arcades, figure shops, and maid cafes.', hours: 3, yen: 3000, tags: ['pop-culture'] },
  { id: 'tky-meiji', regionId: 'tokyo', name: 'Meiji Shrine & Harajuku', blurb: 'A forested Shinto shrine steps from Tokyo\'s trendiest street.', hours: 3, yen: 0, tags: ['history', 'pop-culture'] },
  { id: 'tky-teamlab', regionId: 'tokyo', name: 'teamLab digital art museum', blurb: 'Room-scale projected light installations you walk through.', hours: 3, yen: 3800, tags: ['art', 'pop-culture'] },
  { id: 'tky-golden-gai', regionId: 'tokyo', name: 'Golden Gai bar hopping', blurb: 'Six alleys of two-seat bars packed into Shinjuku.', hours: 3, yen: 6000, tags: ['nightlife'] },
  { id: 'tky-tsukishima', regionId: 'tokyo', name: 'Monjayaki dinner in Tsukishima', blurb: 'Griddle-cooked Tokyo comfort food, table-side.', hours: 2, yen: 3200, tags: ['food'] },
  { id: 'tky-ghibli', regionId: 'tokyo', name: 'Ghibli Museum, Mitaka', blurb: 'A whimsical museum built like a Miyazaki film set.', hours: 3, yen: 2200, tags: ['pop-culture', 'art'] },
  { id: 'tky-sumo', regionId: 'tokyo', name: 'Sumo stable morning practice', blurb: 'Watch wrestlers train up close before the crowds arrive.', hours: 2, yen: 9000, tags: ['history'] },

  // Hakone
  { id: 'hak-ropeway', regionId: 'hakone', name: 'Hakone Ropeway over Owakudani', blurb: 'Cable car over active sulfur vents, with Fuji views on clear days.', hours: 3, yen: 4200, tags: ['nature'] },
  { id: 'hak-onsen-ryokan', regionId: 'hakone', name: 'Ryokan onsen soak', blurb: 'Private or communal hot spring bathing at a traditional inn.', hours: 2, yen: 3000, tags: ['onsen'] },
  { id: 'hak-lake-ashi', regionId: 'hakone', name: 'Lake Ashi pirate cruise', blurb: 'A kitschy replica ship crossing a volcanic caldera lake.', hours: 2, yen: 1200, tags: ['nature'] },
  { id: 'hak-open-air', regionId: 'hakone', name: 'Hakone Open-Air Museum', blurb: 'Sculpture park with a stained-glass tower and foot bath.', hours: 2, yen: 1600, tags: ['art'] },
  { id: 'hak-hike-owakudani', regionId: 'hakone', name: 'Owakudani volcanic trail hike', blurb: 'Short hike past steaming vents to black sulfur eggs.', hours: 2, yen: 500, tags: ['hiking', 'nature'] },
  { id: 'hak-chureito', regionId: 'hakone', name: 'Chureito Pagoda Fuji view', blurb: 'The postcard shot: a red pagoda framing Mt. Fuji.', hours: 3, yen: 800, tags: ['nature', 'hiking'] },

  // Kyoto
  { id: 'kyo-fushimi', regionId: 'kyoto', name: 'Fushimi Inari torii hike', blurb: 'Thousands of vermilion gates climbing a forested mountain.', hours: 3, yen: 0, tags: ['history', 'hiking'] },
  { id: 'kyo-bamboo', regionId: 'kyoto', name: 'Arashiyama bamboo grove', blurb: 'Towering bamboo stalks along a quiet path at sunrise.', hours: 2, yen: 0, tags: ['nature'] },
  { id: 'kyo-kinkakuji', regionId: 'kyoto', name: 'Kinkaku-ji golden pavilion', blurb: 'A gold-leafed temple reflected in a still pond.', hours: 2, yen: 500, tags: ['history'] },
  { id: 'kyo-gion', regionId: 'kyoto', name: 'Gion evening walk', blurb: 'Lantern-lit streets where geiko and maiko still work.', hours: 2, yen: 0, tags: ['history', 'nightlife'] },
  { id: 'kyo-nishiki', regionId: 'kyoto', name: 'Nishiki Market food crawl', blurb: 'Kyoto\'s pantry: pickles, skewers, and knife shops.', hours: 2, yen: 4000, tags: ['food'] },
  { id: 'kyo-tea', regionId: 'kyoto', name: 'Traditional tea ceremony', blurb: 'A quiet matcha ceremony led by a certified host.', hours: 1, yen: 4500, tags: ['history', 'art'] },
  { id: 'kyo-kiyomizu', regionId: 'kyoto', name: 'Kiyomizu-dera temple', blurb: 'A wooden temple on stilts with sweeping city views.', hours: 2, yen: 500, tags: ['history'] },
  { id: 'kyo-pontocho', regionId: 'kyoto', name: 'Pontocho alley dinner', blurb: 'Riverside kaiseki and yakitori in a narrow historic lane.', hours: 2, yen: 8000, tags: ['food', 'nightlife'] },

  // Osaka
  { id: 'osa-dotonbori', regionId: 'osaka', name: 'Dotonbori food crawl', blurb: 'Takoyaki, okonomiyaki, and neon signs over a canal.', hours: 3, yen: 5000, tags: ['food', 'nightlife'] },
  { id: 'osa-castle', regionId: 'osaka', name: 'Osaka Castle', blurb: 'A rebuilt feudal castle with a museum and park grounds.', hours: 2, yen: 600, tags: ['history'] },
  { id: 'osa-kuromon', regionId: 'osaka', name: 'Kuromon Ichiba Market', blurb: 'Grilled seafood skewers eaten standing at market stalls.', hours: 2, yen: 3500, tags: ['food'] },
  { id: 'osa-usj', regionId: 'osaka', name: 'Universal Studios Japan', blurb: 'Mario Kart, Nintendo World, and Harry Potter, Japan-style.', hours: 8, yen: 9400, tags: ['pop-culture'] },
  { id: 'osa-shinsekai', regionId: 'osaka', name: 'Shinsekai retro nightlife', blurb: 'Kushikatsu skewers under a Tower of the Sun-era skyline.', hours: 2, yen: 3000, tags: ['nightlife', 'food'] },
  { id: 'osa-aquarium', regionId: 'osaka', name: 'Osaka Aquarium Kaiyukan', blurb: 'A whale shark circling one of the world\'s largest tanks.', hours: 2, yen: 2700, tags: ['nature'] },

  // Nara
  { id: 'nar-deer', regionId: 'nara', name: 'Nara Park deer feeding', blurb: 'Hundreds of tame deer that bow for rice crackers.', hours: 2, yen: 500, tags: ['nature'] },
  { id: 'nar-daibutsu', regionId: 'nara', name: 'Todai-ji Great Buddha Hall', blurb: 'The largest bronze Buddha statue in the world.', hours: 2, yen: 800, tags: ['history'] },
  { id: 'nar-kasuga', regionId: 'nara', name: 'Kasuga Taisha lantern path', blurb: 'A shrine approach lined with thousands of stone lanterns.', hours: 2, yen: 0, tags: ['history', 'nature'] },
  { id: 'nar-naramachi', regionId: 'nara', name: 'Naramachi old town wander', blurb: 'Merchant-era wooden houses turned cafes and craft shops.', hours: 2, yen: 1500, tags: ['history', 'food'] },

  // Kanazawa
  { id: 'kan-kenrokuen', regionId: 'kanazawa', name: 'Kenrokuen Garden', blurb: 'One of Japan\'s three great gardens, stunning in every season.', hours: 2, yen: 320, tags: ['nature', 'art'] },
  { id: 'kan-higashi', regionId: 'kanazawa', name: 'Higashi Chaya geisha district', blurb: 'Gold-leaf shops and teahouses along a preserved lattice-front street.', hours: 2, yen: 1000, tags: ['history', 'art'] },
  { id: 'kan-omicho', regionId: 'kanazawa', name: 'Omicho Market seafood', blurb: 'Kanazawa\'s kitchen: crab, uni, and sushi over 300 years old.', hours: 2, yen: 4500, tags: ['food'] },
  { id: 'kan-goldleaf', regionId: 'kanazawa', name: 'Gold-leaf workshop', blurb: 'Apply real gold leaf to a souvenir with a local artisan.', hours: 1, yen: 2500, tags: ['art'] },
  { id: 'kan-samurai', regionId: 'kanazawa', name: 'Nagamachi samurai district', blurb: 'Earthen-walled lanes where samurai once lived.', hours: 1, yen: 500, tags: ['history'] },

  // Hiroshima
  { id: 'hir-peace-park', regionId: 'hiroshima', name: 'Peace Memorial Park & Museum', blurb: 'The A-Bomb Dome and a museum that does not look away.', hours: 3, yen: 200, tags: ['history'] },
  { id: 'hir-miyajima', regionId: 'hiroshima', name: 'Miyajima floating torii', blurb: 'A vermilion gate that appears to float at high tide.', hours: 4, yen: 300, tags: ['history', 'nature'] },
  { id: 'hir-okonomiyaki', regionId: 'hiroshima', name: 'Hiroshima-style okonomiyaki', blurb: 'Layered noodle-and-cabbage pancakes cooked table-side.', hours: 1, yen: 1500, tags: ['food'] },
  { id: 'hir-castle', regionId: 'hiroshima', name: 'Hiroshima Castle', blurb: 'A rebuilt riverside castle with a samurai armor museum.', hours: 2, yen: 370, tags: ['history'] },
  { id: 'hir-momiji', regionId: 'hiroshima', name: 'Miyajima ropeway hike', blurb: 'Cable car and trail up Mt. Misen above the torii gate.', hours: 3, yen: 2200, tags: ['hiking', 'nature'] },

  // Hokkaido
  { id: 'hok-otaru', regionId: 'hokkaido', name: 'Otaru canal & glass town', blurb: 'A gaslit canal town famous for hand-blown glass and music boxes.', hours: 3, yen: 1500, tags: ['nature', 'art'] },
  { id: 'hok-ramen', regionId: 'hokkaido', name: 'Sapporo miso ramen alley', blurb: 'A tiny alley of ramen stalls that put miso ramen on the map.', hours: 1, yen: 1200, tags: ['food'] },
  { id: 'hok-furano', regionId: 'hokkaido', name: 'Furano lavender fields', blurb: 'Rolling hills of lavender and flower fields in summer.', hours: 4, yen: 1000, tags: ['nature'] },
  { id: 'hok-noboribetsu', regionId: 'hokkaido', name: 'Noboribetsu Hell Valley onsen', blurb: 'A volcanic valley feeding some of Japan\'s best hot springs.', hours: 3, yen: 1500, tags: ['onsen', 'nature'] },
  { id: 'hok-daisetsuzan', regionId: 'hokkaido', name: 'Daisetsuzan National Park hike', blurb: 'Japan\'s largest national park, wild and largely untouristed.', hours: 5, yen: 3600, tags: ['hiking', 'nature'] },
  { id: 'hok-seafood', regionId: 'hokkaido', name: 'Hakodate morning seafood market', blurb: 'Build your own kaisendon bowl from tanks of live seafood.', hours: 2, yen: 3800, tags: ['food'] },
]

export const ACTIVITIES_BY_REGION = ACTIVITIES.reduce<Record<string, Activity[]>>((acc, a) => {
  ;(acc[a.regionId] ??= []).push(a)
  return acc
}, {})
