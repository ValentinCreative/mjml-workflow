import through from 'through2'

function addWidthHeight(svg) {
    const findViewBox = /viewBox="(\d+\.?\d ?){4}"/g
    const viewBox     = svg.match(findViewBox)[0]
    const findOffset  = /(\d+\.?\d ?){4}/g
    const offset      = viewBox.match(findOffset)[0].split(' ')
    const width       = offset[2]
    const height      = offset[3]

    return svg.replace(viewBox, `${viewBox} width="${width}" height="${height}"`)
}

function gulpSvgSize() {

    return through.obj((file, enc, callback) => {

        if (file.isNull()) {
            return callback(null, file)
        }

        if (file.isBuffer()) {
            const svg     = file.contents.toString()
            file.contents = new Buffer(addWidthHeight(svg))
        }

        callback(null, file)

    })

}

module.exports = gulpSvgSize
