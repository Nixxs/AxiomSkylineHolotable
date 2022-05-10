export const bookmarksConfig: IBookmarkConfig = {
    bookmarks: [
        {
            name: "Sydney",
            position: {
                X: 151.2067675,
                Y: -33.8667266, 
                Altitude: 5000, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -80, 
                Roll: 0, 
                Distance: 5000
            }
        },
        {
            name: "Whyalla",
            position: {
                X: 137.5576346,
                Y:-33.0357364,
                Altitude: 5000, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -80, 
                Roll: 0, 
                Distance: 5000
            },
        },
        {
            name: "Puckapunyal",
            position: {
                X: 145.0359724,
                Y:  -37.0008314,
                Altitude: 5000, 
                AltitudeType: 3,
                Yaw: 0, 
                Pitch: -80, 
                Roll: 0, 
                Distance: 5000
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

