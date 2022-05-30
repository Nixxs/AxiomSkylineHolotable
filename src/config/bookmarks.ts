export const bookmarksConfig: IBookmarkConfig = {
    bookmarks: [
        {
            name: "OBJ AARDVARK",
            position: {
                X: 145.02864152,
                Y: -37.39348623, 
                Altitude: 20450.909, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 20450.909
            }
        },
        {
            name: "OBJ BADGER",
            position: {
                X: 145.04932964,
                Y:-37.19835798,
                Altitude: 2363.2701, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50.007783, 
                Roll: 0, 
                Distance: 2363.2701
            },
        },
        {
            name: "OBJ CASSOWAY",
            position: {
                X: 145.14034012,
                Y: -36.99948321,
                Altitude: 1241.1836, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 15076.839
            },
        },
        {
            name: "OBJ DUCK",
            position: {
                X: 145.21911343,
                Y:  -36.89400933,
                Altitude: 1241.1836, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 1241.1836
            },
        },
        {
            name: "OBJ ALBATROSS",
            position: {
                X: 145.40501385,
                Y:  -36.34393385,
                Altitude: 24303.997, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 24303.997
            },
        },
        {
            name: "OBJ EMU",
            position: {
                X: 145.57263976,
                Y:  -36.7322975,
                Altitude: 3, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 11308.023
            },
        },
        {
            name: "OBJ FALCON",
            position: {
                X: 145.71741313,
                Y:  -36.61581478,
                Altitude: 8793.0359, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 8793.0359
            },
        },{
            name: "MELBOURNE",
            position: {
                X: 144.99148652,
                Y:  -37.78937768,
                Altitude: 17272.057, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 17272.057
            },
        },{
            name: "OBJ BLUEBIRD",
            position: {
                X: 144.2822635,
                Y:  -36.75873505,
                Altitude: 15710.816, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 400.229
            },
        },{
            name: "OBJ GALAH",
            position: {
                X: 145.86157198,
                Y:  -36.57603154,
                Altitude: 7412.7258, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 7412.7258
            },
        },{
            name: "OBJ HAWK",
            position: {
                X: 145.97070419,
                Y:  -36.51705803,
                Altitude: 18547.527, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 18547.527
            },
        },{
            name: "OBJ IBIS",
            position: {
                X: 146.22730218,
                Y:  -36.44666363,
                Altitude: 10862.869, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 10862.869
            },
        },{
            name: "OBJ JABIRU",
            position: {
                X: 146.30756967,
                Y: -36.31669413,
                Altitude: 21377.522, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 21377.522
            },
        },{
            name: "OBJ KAKA",
            position: {
                X: 146.47070704,
                Y:  -36.17283963,
                Altitude: 6568.6377, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 6568.6377
            },
        },{
            name: "OBJ LAPWING",
            position: {
                X: 146.6127613,
                Y:  -36.13260823,
                Altitude: 9220.0706, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 9220.0706
            },
        },{
            name: "OBJ MAGPIE",
            position: {
                X: 146.88017819,
                Y:  -36.04213735,
                Altitude: 33497.648, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 33497.648
            },
        },{
            name: "STRATHBOGIEGOAT",
            position: {
                X: 145.18482122,
                Y:  -36.9565905,
                Altitude: 33497.648, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 329.8629
            },
        },{
            name: "COACH ROAD",
            position: {
                X: 145.21197986,
                Y:  -36.94201526,
                Altitude: 33497.648, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 666.9621
            },
        }
    ]
}

export interface IBookmarkConfig {
    bookmarks: IBookmark[];
}

export interface IBookmark {
    name: string;
    position: IBookmarkPosition;
}

export interface IBookmarkPosition {
    Altitude: number;
    AltitudeType: 0 | 1 | 2 | 3 | 4;
    Cartesian?: boolean;
    Distance: number;
    Pitch: number;
    Roll: number;
    X: number;
    Y: number;
    Yaw: number;
}

