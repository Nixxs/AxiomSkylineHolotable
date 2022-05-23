export const bookmarksConfig: IBookmarkConfig = {
    bookmarks: [
        {
            name: "Bendigo",
            position: {
                X: 144.28003,
                Y: -36.761405, 
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 2091.6079
            }
        },
        {
            name: "Seymore",
            position: {
                X: 145.224651,
                Y:-36.9625506,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50.007783, 
                Roll: 0, 
                Distance: 2179.73
            },
        },
        {
            name: "Sydney",
            position: {
                X: 151.203076,
                Y:  -33.874267268,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 3696.033954
            },
        },
        {
            name: "Strathbogiegoat",
            position: {
                X: 145.18114366,
                Y:  -36.9646484,
                Altitude: 0, 
                AltitudeType: 0,
                Yaw: 0, 
                Pitch: -50, 
                Roll: 0, 
                Distance: 1768.7141158
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

