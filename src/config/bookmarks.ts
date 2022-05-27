export const bookmarksConfig: IBookmarkConfig = {
    bookmarks: [
        {
            name: "OBJ AARDVARK",
            position: {
                X: 145.00724027499797,
                Y: -37.4071058274123, 
                Altitude: 14370.705656319745, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 16597.164
            }
        },
        {
            name: "OBJ BADGER",
            position: {
                X: 145.05863716,
                Y:-37.20148837,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50.007783, 
                Roll: 0, 
                Distance: 10873.818
            },
        },
        {
            name: "OBJ CASSOWAY",
            position: {
                X: 145.17657047,
                Y:  -37.0306832,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 18665.206
            },
        },
        {
            name: "OBJ DUCK",
            position: {
                X: 145.24676513,
                Y:  -36.90352823,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 18325.42
            },
        },
        {
            name: "OBJ ALBATROSS",
            position: {
                X: 145.4289109,
                Y:  -36.38929339,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 31878.276
            },
        },
        {
            name: "OBJ EMU",
            position: {
                X: 145.59395914,
                Y:  -36.75615997,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 10624.777
            },
        },
        {
            name: "OBJ FALCON",
            position: {
                X: 145.7270155,
                Y:  -36.63879829,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 7564.9396
            },
        },{
            name: "MELBOURNE",
            position: {
                X: 144.97065926872557,
                Y:  -37.76446403056759,
                Altitude: 26353.564460337027, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 50076.846
            },
        },{
            name: "OBJ BLUEBIRD",
            position: {
                X: 144.30674965,
                Y:  -36.76241963,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 15710.816
            },
        },{
            name: "OBJ GALAH",
            position: {
                X: 145.87146543,
                Y:  -36.59429059,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 9842.7081
            },
        },{
            name: "OBJ HAWK",
            position: {
                X: 146.01150929,
                Y:  -36.55772302,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 20517.88
            },
        },{
            name: "OBJ IBIS",
            position: {
                X: 146.23130193,
                Y:  -36.46695354,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 11753.13
            },
        },{
            name: "OBJ JABIRU",
            position: {
                X: 146.32942442,
                Y:  -36.36614346,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 19506.554
            },
        },{
            name: "OBJ KAKA",
            position: {
                X: 146.47037057,
                Y:  -36.18813195,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 9858.7836
            },
        },{
            name: "OBJ LAPWING",
            position: {
                X: 146.615064097,
                Y:  -36.15122723,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 7406.5474
            },
        },{
            name: "OBJ MAGPIE",
            position: {
                X: 146.91973205,
                Y:  -36.1307173,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 41400.168
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

