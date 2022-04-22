export class Matrix3 {
    /**
     * 列优先计算矩阵相乘
     * @param left 左矩阵，3x3
     * @param right 右矩阵，3x3
     */
    static multiply(left: number[], right: number[]) {
        const combination = [];
        for (let i = 0; i < 3; i++) {
            // 列
            const rightColumn = right.slice(i * 3, i * 3 + 3);
            for (let j = 0; j < 3; j++) {
                // 行
                const leftColumn = [left[j], left[j + 3], left[j + 6]];
                const result = leftColumn.reduce(
                    (sum, leftItem, index) => sum + leftItem * rightColumn[index],
                    0
                );
                combination.push(result);
            }
        }
        return combination;
    }

    static identity() {
        return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }

    static translate(matrix: number[], tx: number, ty: number) {
        return Matrix3.multiply(matrix, [1, 0, 0, 0, 1, 0, tx, ty, 1]);
    }

    static rotate(matrix: number[], angleInRadians: number) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);
        return Matrix3.multiply(matrix, [c, -s, 0, s, c, 0, 0, 0, 1]);
    }

    static scale(matrix: number[], sx: number, sy: number) {
        return Matrix3.multiply(matrix, [sx, 0, 0, 0, sy, 0, 0, 0, 1]);
    }

    static projection(canvasWidth: number, canvasHeight: number, needFlip: boolean) {
        const flipY = Matrix3.scale(Matrix3.identity(), 1, needFlip ? -1 : 1); // 翻转Y轴
        const moveMinusOne = Matrix3.translate(flipY, -1, -1); // XY向反方向移动1个单位
        const scaleDouble = Matrix3.scale(moveMinusOne, 2, 2); // XY放大两倍
        const scaleCanvas = Matrix3.scale(scaleDouble, 1 / canvasWidth, 1 / canvasHeight); // 按照画布比例缩放
        return scaleCanvas;
    }
}
