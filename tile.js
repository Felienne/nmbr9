"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Tile {
}
exports.Tile = Tile;
function getTile(n) {
    if (n < 0 || n > 9)
        throw new Error('Value of a tile can only be from 0 to 9.');
    let t = new Tile;
    t.value = n;
    switch (n) {
        case 0: {
            t.form = [[1, 1, 1],
                [1, 0, 1],
                [1, 0, 1],
                [1, 1, 1]];
            break;
        }
        case 1: {
            t.form = [[1, 1, 0],
                [0, 1, 0],
                [0, 1, 0],
                [0, 1, 0]];
            break;
        }
        case 2: {
            t.form = [[0, 1, 1],
                [0, 1, 1],
                [1, 1, 0],
                [1, 1, 1]];
            break;
        }
        case 3: {
            t.form = [[1, 1, 1],
                [0, 0, 1],
                [0, 1, 1],
                [1, 1, 1]];
            break;
        }
        case 4: {
            t.form = [[0, 1, 1],
                [0, 1, 0],
                [1, 1, 1],
                [0, 1, 1]];
            break;
        }
        case 5: {
            t.form = [[1, 1, 1],
                [1, 1, 1],
                [0, 0, 1],
                [1, 1, 1]];
            break;
        }
        case 6: {
            t.form = [[1, 1, 0],
                [1, 0, 0],
                [1, 1, 1],
                [1, 1, 1]];
            break;
        }
        case 7: {
            t.form = [[1, 1, 1],
                [0, 1, 0],
                [1, 1, 0],
                [1, 0, 0]];
            break;
        }
        case 8: {
            t.form = [[0, 1, 1],
                [0, 1, 1],
                [1, 1, 0],
                [1, 1, 0]];
            break;
        }
        case 9: {
            t.form = [[1, 1, 1],
                [1, 1, 1],
                [1, 1, 0],
                [1, 1, 0]];
            break;
        }
    }
    return t;
}
exports.getTile = getTile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxNQUFhLElBQUk7Q0FLaEI7QUFMRCxvQkFLQztBQUVELFNBQWdCLE9BQU8sQ0FBQyxDQUFRO0lBRTVCLElBQUksQ0FBQyxHQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQztRQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQztJQUU1RSxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQztJQUNqQixDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztJQUVaLFFBQU8sQ0FBQyxFQUFFO1FBQ04sS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUNQLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDUCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQixNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDUCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUNQLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25CLE1BQU07U0FDVDtRQUNELEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztn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Q0FBQztZQUNuQixNQUFNO1NBQ1Q7S0FDSjtJQUVELE9BQU8sQ0FBQyxDQUFDO0FBQ2IsQ0FBQztBQWpGRCwwQkFpRkMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgVGlsZSB7XG4gICAgcHVibGljIHZhbHVlOiBudW1iZXI7XG4gICAgcHVibGljIGZvcm06IG51bWJlcltdW107XG5cblxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGlsZShuOm51bWJlcik6IFRpbGVcbntcbiAgICBpZiAobjwwIHx8IG4+OSkgdGhyb3cgbmV3IEVycm9yKCdWYWx1ZSBvZiBhIHRpbGUgY2FuIG9ubHkgYmUgZnJvbSAwIHRvIDkuJyk7XG5cbiAgICBsZXQgdCA9IG5ldyBUaWxlO1xuICAgIHQudmFsdWUgPSBuO1xuXG4gICAgc3dpdGNoKG4pIHtcbiAgICAgICAgY2FzZSAwOiB7XG4gICAgICAgICAgICB0LmZvcm0gPSBbWzEsMSwxXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMSwwLDFdLFxuICAgICAgICAgICAgICAgICAgICAgIFsxLDAsMV0sXG4gICAgICAgICAgICAgICAgICAgICAgWzEsMSwxXV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDE6IHtcbiAgICAgICAgICAgIHQuZm9ybSA9IFtbMSwxLDBdLFxuICAgICAgICAgICAgICAgICAgICAgIFswLDEsMF0sXG4gICAgICAgICAgICAgICAgICAgICAgWzAsMSwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCwxLDBdXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgMjoge1xuICAgICAgICAgICAgdC5mb3JtID0gW1swLDEsMV0sXG4gICAgICAgICAgICAgICAgICAgICAgWzAsMSwxXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMSwxLDBdLFxuICAgICAgICAgICAgICAgICAgICAgIFsxLDEsMV1dO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAzOiB7XG4gICAgICAgICAgICB0LmZvcm0gPSBbWzEsMSwxXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCwwLDFdLFxuICAgICAgICAgICAgICAgICAgICAgIFswLDEsMV0sXG4gICAgICAgICAgICAgICAgICAgICAgWzEsMSwxXV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDQ6IHtcbiAgICAgICAgICAgIHQuZm9ybSA9IFtbMCwxLDFdLFxuICAgICAgICAgICAgICAgICAgICAgIFswLDEsMF0sXG4gICAgICAgICAgICAgICAgICAgICAgWzEsMSwxXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCwxLDFdXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgNToge1xuICAgICAgICAgICAgdC5mb3JtID0gW1sxLDEsMV0sXG4gICAgICAgICAgICAgICAgICAgICAgWzEsMSwxXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCwwLDFdLFxuICAgICAgICAgICAgICAgICAgICAgIFsxLDEsMV1dO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSA2OiB7XG4gICAgICAgICAgICB0LmZvcm0gPSBbWzEsMSwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMSwwLDBdLFxuICAgICAgICAgICAgICAgICAgICAgIFsxLDEsMV0sXG4gICAgICAgICAgICAgICAgICAgICAgWzEsMSwxXV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDc6IHtcbiAgICAgICAgICAgIHQuZm9ybSA9IFtbMSwxLDFdLFxuICAgICAgICAgICAgICAgICAgICAgIFswLDEsMF0sXG4gICAgICAgICAgICAgICAgICAgICAgWzEsMSwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMSwwLDBdXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgODoge1xuICAgICAgICAgICAgdC5mb3JtID0gW1swLDEsMV0sXG4gICAgICAgICAgICAgICAgICAgICAgWzAsMSwxXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMSwxLDBdLFxuICAgICAgICAgICAgICAgICAgICAgIFsxLDEsMF1dO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSA5OiB7XG4gICAgICAgICAgICB0LmZvcm0gPSBbWzEsMSwxXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMSwxLDFdLFxuICAgICAgICAgICAgICAgICAgICAgIFsxLDEsMF0sXG4gICAgICAgICAgICAgICAgICAgICAgWzEsMSwwXV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0O1xufSJdfQ==