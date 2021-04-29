const defaultIntervals = [0, 1, 3, 7, 14, 29]
const msPerDay = 24 * 60 * 60 * 1000
const app = {
  mounted () {
    this.restore()
    this.commit()
  },

  data () {
    return {
      // UI parameters
      title: '',
      weeks: [],
      newListPrefix: '',
      reviewListPrefix: '',
      weekdayNames: [],
      newParameters: {
      },
      // Table parameters
      parameters: {
        date: new Date(),
        monday: false,
        week: 'Sun',
        title: '17天GRE单词背诵计划时间表',
        prefix: 'L',
        listTotal: 42,
        listPerDay: 2,
        reversed: false,
        intervals: [],
        skippedDates: [],
      },
    }
  },

  computed: {
    greIntervals () {
      return defaultIntervals
    },

    displayedDate: {
      get () {
        return (this.parameters.date.getFullYear()
                + '-'
                + ('0' + (this.parameters.date.getMonth() + 1)).slice(-2)
                + '-'
                + ('0' + this.parameters.date.getDate()).slice(-2)
               )
      },
      set (dateString) {
        console.log(dateString)
        this.parameters.date = new Date(dateString)
      },
    },

    displayedIntervals: {
      get () {
        return this.newParameters.intervals && this.newParameters.intervals.join(',')
      },
      set (string) {
        var intervals = this.normalizeIntegersString(string)
        if(intervals) {
          this.newParameters.intervals = intervals
        }
      },
    },

    displayedSkippedDates: {
      get () {
        return this.newParameters.skippedDates && this.newParameters.skippedDates.join(',')
      },
      set (string) {
        var dates = this.normalizeIntegersString(string)
        if(dates) {
          this.newParameters.skippedDates = dates
        }
      },
    },

    monday: {
      get () {
        return this.newParameters.week === 'Mon'
      },
      set (mondayFirst) {
        if(mondayFirst) {
          this.newParameters.week = 'Mon'
        } else {
          this.newParameters.week = 'Sun'
        }
      },
    },
  },

  methods: {
    userCommit () {
      Object.assign(this.parameters, this.normalizeParameters(this.newParameters))
      this.commit()
    },
    commit () {
      this.update(this.parameters)
      this.updateURL()
    },

    updateURL () {
      var url = new URL(window.location)
      for(var i in this.parameters) {
        if(i === 'date') {
          url.searchParams.set(i, this.displayedDate)
        } else if(i === 'intervals') {
          url.searchParams.set(i, this.displayedIntervals)
        } else if(i === 'skippedDates') {
          url.searchParams.set(i, this.displayedSkippedDates)
        } else {
          url.searchParams.set(i, this.parameters[i])
        }
      }
      window.history.pushState("", this.title, url.href)
    },

    restore () {
      var url = new URL(window.location)
      var newParameters = {}
      for(var i in this.parameters) {
        var value = url.searchParams.get(i)
        if(value) {
          newParameters[i] = value
        }
      }
      Object.assign(this.parameters, this.normalizeParameters(newParameters))
    },

    normalizeIntegersString (arrayString) {
      try {
        var array = JSON.parse('[' + arrayString + ']')
        if(Array.isArray(array) && array.reduce((allNumber, value) => {
          return allNumber && Number.isInteger(value) && value >= 0
        })) {
          return array
        } else {
          return false
        }
      } catch (e) {
        return undefined
      }
    },

    normalizeParameters (parameters) {
      if(typeof(parameters.reversed) === 'string') {
        if(parameters.reversed === "true") {
          parameters.reversed = true
        } else {
          parameters.reversed = false
        }
      }
      parameters.date = new Date(parameters.date)
      if(Number.isNaN(parameters.date.getTime())) {
        delete parameters.date
      }
      parameters.listTotal = Number.parseInt(parameters.listTotal)
      if(!(Number.isInteger(parameters.listTotal) &&
           parameters.listTotal > 0
          )) {
        delete parameters.listTotal
      }
      parameters.listPerDay = Number.parseInt(parameters.listPerDay)
      if(!(Number.isInteger(parameters.listPerDay) &&
           parameters.listPerDay > 0
          )) {
        delete parameters.listPerDay
      }
      parameters.intervals = this.normalizeIntegersString(parameters.intervals)
      if(!parameters.intervals) {
        delete parameters.intervals
      }
      parameters.skippedDates = this.normalizeIntegersString(parameters.skippedDates)
      if(!parameters.skippedDates) {
        delete parameters.skippedDates
      }
      return parameters
    },

    increaseDate (date, days) {
      return new Date(date.getTime() + days * msPerDay)
    },
    getDistance (date1, date2) {
      return Math.round((date1 - date2) / msPerDay)
    },

    weekStartDate (date, weekType) {
      var sunday = this.increaseDate(date, -date.getDay())
      if(weekType === 'Mon') {
        if(date.getDay() === 0) {
          return this.increaseDate(sunday, -7 + 1)
        } else {
          return this.increaseDate(sunday, 1)
        }
      } else {
        return sunday
      }
    },

    initWeekdayNames (weekType) {
      var weekStart = this.weekStartDate(new Date(), weekType)

      var formatter = new Intl.DateTimeFormat([], {weekday: 'short'})
      var names = []
      for(var i = 0; i != 7; ++i) {
        names.push(formatter.format(this.increaseDate(weekStart, i)))
      }
      return names
    },

    initWeeks (weekNumber) {
      var weeks = new Array(weekNumber)
      for(var i = 0; i != weekNumber; ++i) {
        weeks[i] = [null, null, null, null, null, null, null]
      }
      return weeks
    },

    initCalendar (duration) {
      var calendar = new Array(duration)
      for(var i = 0; i != duration; ++i) {
        calendar[i] = {
          newLists: [],
          reviewLists: []
        }
      }
      return calendar
    },

    generateLinearCalendar (lists, intervals, skippedDates) {
      const duration = lists.length + Math.max(...intervals) + skippedDates.length
      var calendar = this.initCalendar(duration)
      var offset = 0
      for(var i = 0; i != lists.length; ++i) {
        if(skippedDates.includes(i + offset + 1)) {
          console.log(i, offset, skippedDates)
          --i
          ++offset
          continue
        } else {
          calendar[i + offset].newLists.push(lists[i])
          for(var interval of intervals) {
            calendar[i + interval + offset].reviewLists.push(lists[i])
          }
        }
      }
      return calendar
    },

    generateWeeks (linearCalendar, startDate, weekType) {
      var weekStart = this.weekStartDate(startDate, weekType)
      var offset = this.getDistance(startDate, weekStart)
      var weekNumber = Math.ceil(
        (offset + linearCalendar.length) / 7
      )
      var weeks = this.initWeeks(weekNumber)
      for(var i = 0; i != linearCalendar.length; ++i) {
        var totalOffset = offset + i
        var week = Math.floor(totalOffset / 7)
        var day = totalOffset % 7
        weeks[week][day] = {
          date: this.increaseDate(startDate, i),
          lists: linearCalendar[i]
        }
      }
      return weeks
    },

    group (totalListNumber, quota, reversed) {
      var lists = []
      for(var i = 0; i != Math.ceil(totalListNumber / quota); ++i) {
        var lhs = i * quota
        var rhs = (i + 1) * quota
        if(rhs > totalListNumber) {
          rhs = totalListNumber
        }
        if(reversed) {
          var leftTmp = lhs
          lhs = totalListNumber - rhs + 1
          rhs = totalListNumber - leftTmp
        } else {
          lhs += 1
        }

        if(lhs === rhs) {
          lists.push('' + lhs)
        } else {
          lists.push(lhs + '~' + rhs)
        }
      }
      return lists
    },

    update (parameters) {
      var lists = this.group(parameters.listTotal,
                             parameters.listPerDay,
                             parameters.reversed
                            )
      if(parameters.intervals && parameters.intervals.length > 0) {
        var calendar = this.generateLinearCalendar(lists,
                                                   parameters.intervals,
                                                   parameters.skippedDates
                                                  )
      } else {
        var calendar = this.generateLinearCalendar(lists,
                                                   defaultIntervals,
                                                   parameters.skippedDates
                                                  )
      }
      var weeks = this.generateWeeks(calendar,
                                     parameters.date,
                                     parameters.week)
      document.title = parameters.title
      this.title = parameters.title
      this.newListPrefix = parameters.prefix
      this.reviewListPrefix = parameters.prefix + '*'
      this.weekdayNames = this.initWeekdayNames(parameters.week)
      this.weeks = weeks
      Object.assign(this.newParameters, this.parameters)
    },
  },
}

Vue.createApp(app).mount('#app');
