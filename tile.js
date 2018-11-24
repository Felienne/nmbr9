"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Tile {
    // of the same number, since it is not allowed to place a tile on one instance.
    // since there is only one tile per turn, this serves as identity
    getOnes() {
        const ones = [];
        for (let y = 0; y < 6; y++) {
            for (let x = 0; x < 5; x++) {
                if (this.form[y][x] === 1) {
                    ones.push({ y, x });
                    //TODO: iets komt nu altijd op level 1 terecht
                } //TODO: Ook nog zorgen dat je geen 1'tjes overschrijft met vtjes.
            }
        }
        return ones;
    }
}
exports.Tile = Tile;
exports.TILE_COLORS = [
    '#BABABA',
    '#9C7300',
    '#BD6B0D',
    '#F2DB27',
    '#559E1C',
    '#4AD1D4',
    '#336FF2',
    '#9C0FD4',
    '#E820E8',
    '#D42242',
];
function getTile(n) {
    if (n < 0 || n > 9)
        throw new Error('Value of a tile can only be from 0 to 9.');
    let t = new Tile;
    t.value = n;
    const v = -1;
    switch (n) {
        case 0: {
            t.form = [[0, v, v, v, 0],
                [v, 1, 1, 1, v],
                [v, 1, 0, 1, v],
                [v, 1, 0, 1, v],
                [v, 1, 1, 1, v],
                [0, v, v, v, 0]];
            break;
        }
        case 1: {
            t.form = [[0, v, v, 0, 0],
                [v, 1, 1, v, 0],
                [0, v, 1, v, 0],
                [0, v, 1, v, 0],
                [0, v, 1, v, 0],
                [0, 0, v, 0, 0]];
            break;
        }
        case 2: {
            t.form = [[0, 0, v, v, 0],
                [0, v, 1, 1, v],
                [0, v, 1, 1, v],
                [v, 1, 1, v, 0],
                [v, 1, 1, 1, v],
                [0, v, v, v, 0]];
            break;
        }
        case 3: {
            t.form = [[0, v, v, v, 0],
                [v, 1, 1, 1, v],
                [0, v, v, 1, v],
                [0, v, 1, 1, v],
                [v, 1, 1, 1, v],
                [0, v, v, v, 0]];
            break;
        }
        case 4: {
            t.form = [[0, 0, v, v, 0],
                [0, v, 1, 1, v],
                [0, v, 1, v, 0],
                [v, 1, 1, 1, v],
                [0, v, 1, 1, v],
                [0, 0, v, v, 0]];
            break;
        }
        case 5: {
            t.form = [[0, v, v, v, 0],
                [v, 1, 1, 1, v],
                [v, 1, 1, 1, v],
                [0, v, v, 1, v],
                [v, 1, 1, 1, v],
                [0, v, v, v, 0]];
            break;
        }
        case 6: {
            t.form = [[0, v, v, 0, 0],
                [v, 1, 1, v, 0],
                [v, 1, v, v, 0],
                [v, 1, 1, 1, v],
                [v, 1, 1, 1, v],
                [0, v, v, v, 0]];
            break;
        }
        case 7: {
            t.form = [[0, v, v, v, 0],
                [v, 1, 1, 1, v],
                [0, v, 1, v, 0],
                [v, 1, 1, v, 0],
                [v, 1, v, 0, 0],
                [0, v, 0, 0, 0]];
            break;
        }
        case 8: {
            t.form = [[0, 0, v, v, 0],
                [0, v, 1, 1, v],
                [0, v, 1, 1, v],
                [v, 1, 1, v, 0],
                [v, 1, 1, v, 0],
                [0, v, v, 0, 0]];
            break;
        }
        case 9: {
            t.form = [[0, v, v, v, 0],
                [v, 1, 1, 1, v],
                [v, 1, 1, 1, v],
                [v, 1, 1, v, 0],
                [v, 1, 1, v, 0],
                [0, v, v, 0, 0]];
            break;
        }
    }
    return t;
}
exports.getTile = getTile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSxNQUFhLElBQUk7SUFJWSwrRUFBK0U7SUFDL0UsaUVBQWlFO0lBRW5GLE9BQU87UUFDVixNQUFNLElBQUksR0FBRyxFQUFFLENBQUM7UUFDaEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBQztZQUN2QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFDO2dCQUN2QixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFDO29CQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7b0JBQ2pCLDhDQUE4QztpQkFDakQsQ0FBQyxpRUFBaUU7YUFDdEU7U0FDSjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7Q0FDSjtBQW5CRCxvQkFtQkM7QUFFWSxRQUFBLFdBQVcsR0FBRztJQUN2QixTQUFTO0lBQ1QsU0FBUztJQUNULFNBQVM7SUFDVCxTQUFTO0lBQ1QsU0FBUztJQUNULFNBQVM7SUFDVCxTQUFTO0lBQ1QsU0FBUztJQUNULFNBQVM7SUFDVCxTQUFTO0NBQ1osQ0FBQztBQUVGLFNBQWdCLE9BQU8sQ0FBQyxDQUFRO0lBRTVCLElBQUksQ0FBQyxHQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQztRQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQztJQUU1RSxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQztJQUNqQixDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNaLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWIsUUFBTyxDQUFDLEVBQUU7UUFDTixLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUNYLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUNYLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUNYLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUNYLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUNYLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUNYLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUNYLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUNYLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUNYLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixNQUFNO1NBQ1Q7UUFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUNYLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixNQUFNO1NBQ1Q7S0FDSjtJQUVELE9BQU8sQ0FBQyxDQUFDO0FBQ2IsQ0FBQztBQXRHRCwwQkFzR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB0b0FTQ0lJIH0gZnJvbSBcInB1bnljb2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBUaWxlIHtcbiAgICBwdWJsaWMgdmFsdWU6IG51bWJlcjtcbiAgICBwdWJsaWMgZm9ybTogbnVtYmVyW11bXTtcbiAgICBwdWJsaWMgdHVybjogbnVtYmVyOyAgICAgLy8gdHVybiByZXByZXNlbnRzIGF0IHdoaWNoIHR1cm4gdGhpcyB0aWxlIGlzIHVzZWQuIFRoaXMgaXMgaW1wb3J0YW50IHRvIGJlIGFibGUgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBkaWZmZXJlbnQgaW5zdGFuY2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIHRoZSBzYW1lIG51bWJlciwgc2luY2UgaXQgaXMgbm90IGFsbG93ZWQgdG8gcGxhY2UgYSB0aWxlIG9uIG9uZSBpbnN0YW5jZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2luY2UgdGhlcmUgaXMgb25seSBvbmUgdGlsZSBwZXIgdHVybiwgdGhpcyBzZXJ2ZXMgYXMgaWRlbnRpdHlcblxuICAgIHB1YmxpYyBnZXRPbmVzKCl7XG4gICAgICAgIGNvbnN0IG9uZXMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCA2OyB5Kyspe1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCA1OyB4Kyspe1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZvcm1beV1beF0gPT09IDEpe1xuICAgICAgICAgICAgICAgICAgICBvbmVzLnB1c2goe3kseH0pO1xuICAgICAgICAgICAgICAgICAgICAvL1RPRE86IGlldHMga29tdCBudSBhbHRpamQgb3AgbGV2ZWwgMSB0ZXJlY2h0XG4gICAgICAgICAgICAgICAgfSAvL1RPRE86IE9vayBub2cgem9yZ2VuIGRhdCBqZSBnZWVuIDEndGplcyBvdmVyc2NocmlqZnQgbWV0IHZ0amVzLlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvbmVzO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IFRJTEVfQ09MT1JTID0gW1xuICAgICcjQkFCQUJBJywgLy8gMFxuICAgICcjOUM3MzAwJywgLy8gMVxuICAgICcjQkQ2QjBEJywgLy8gMlxuICAgICcjRjJEQjI3JywgLy8gM1xuICAgICcjNTU5RTFDJywgLy8gNFxuICAgICcjNEFEMUQ0JywgLy8gNVxuICAgICcjMzM2RkYyJywgLy8gNlxuICAgICcjOUMwRkQ0JywgLy8gN1xuICAgICcjRTgyMEU4JywgLy8gOFxuICAgICcjRDQyMjQyJywgLy8gOVxuXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRpbGUobjpudW1iZXIpOiBUaWxlXG57XG4gICAgaWYgKG48MCB8fCBuPjkpIHRocm93IG5ldyBFcnJvcignVmFsdWUgb2YgYSB0aWxlIGNhbiBvbmx5IGJlIGZyb20gMCB0byA5LicpO1xuXG4gICAgbGV0IHQgPSBuZXcgVGlsZTtcbiAgICB0LnZhbHVlID0gbjtcbiAgICBjb25zdCB2ID0gLTE7XG5cbiAgICBzd2l0Y2gobikge1xuICAgICAgICBjYXNlIDA6IHtcbiAgICAgICAgICAgIHQuZm9ybSA9IFtbMCx2LHYsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDAsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDAsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LHYsdiwwXV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDE6IHtcbiAgICAgICAgICAgIHQuZm9ybSA9IFtbMCx2LHYsMCwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LDEsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LDEsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LDEsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCwwLHYsMCwwXV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDI6IHtcbiAgICAgICAgICAgIHQuZm9ybSA9IFtbMCwwLHYsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LHYsdiwwXV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDM6IHtcbiAgICAgICAgICAgIHQuZm9ybSA9IFtbMCx2LHYsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LHYsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LHYsdiwwXV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDQ6IHtcbiAgICAgICAgICAgIHQuZm9ybSA9IFtbMCwwLHYsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LDEsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCwwLHYsdiwwXV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDU6IHtcbiAgICAgICAgICAgIHQuZm9ybSA9IFtbMCx2LHYsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LHYsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LHYsdiwwXV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDY6IHtcbiAgICAgICAgICAgIHQuZm9ybSA9IFtbMCx2LHYsMCwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLHYsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LHYsdiwwXV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDc6IHtcbiAgICAgICAgICAgIHQuZm9ybSA9IFtbMCx2LHYsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LDEsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLHYsMCwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LDAsMCwwXV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDg6IHtcbiAgICAgICAgICAgIHQuZm9ybSA9IFtbMCwwLHYsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LHYsMCwwXV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDk6IHtcbiAgICAgICAgICAgIHQuZm9ybSA9IFtbMCx2LHYsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsMSx2XSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbdiwxLDEsdiwwXSxcbiAgICAgICAgICAgICAgICAgICAgICBbMCx2LHYsMCwwXV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0O1xufSJdfQ==