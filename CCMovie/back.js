var CCMovieSelector = {
        day: '25',
        month: 'Abril',
        AMOUNT: 4,
        PAY_AMOUNT: '2,680.00',
        DOWNTOWN_URL: "https://caribbeanpay.com/theaters/downtowncenter/",
        REFRESH_TIME: 10000,
        getPhases: ['selectDate', 'findMovie', 'selectSeats', 'selectPaymentMethod', 'makePayment', 'confirmPayment', 'paymentConfirmed'],
        start: function() {
            const me = this;
            me.setMovieSelector('selectDate');
            location.assign(me.DOWNTOWN_URL);
        },
        stop: function() {
            localStorage.removeItem('CCMovieSelector');
        },
        handleCCMovieSelector: function() {
            const me = this;
            const MAIN_URL = 'caribbeanpay.com';
            const PAYMENT_URL = 'pagos.azul.com.do/paymentpage';
            const HREF = location.href;
            if(HREF.includes(MAIN_URL)) {
                let movieSelector = me.getMovieSelector();
                if (movieSelector) {
                    let phase = movieSelector.phase;
                    switch(phase) {
                        case 'selectDate':
                            me.selectDate(me.day, me.month);
                            movieSelector.actionsTaken.push('Date selected. ' + new Date());
                            me.saveMovieSelector(movieSelector);
                            break;
                        case 'findMovie':
                            //me.findMovie(this.AMOUNT);
                            me.selectDate(me.day, me.month);
                            break;
                        case 'selectSeats':
                            me.selectSeats(this.AMOUNT);
                            break;
                        case 'selectPaymentMethod':
                            me.selectPaymentMethod();
                            break;
                        case 'paymentConfirmed':
                            movieSelector.actionsTaken.push('Payment Confirmed. ' + new Date());
                            me.saveMovieSelector(movieSelector);
                            setTimeout(function() {
                                //localStorage.removeItem('CCMovieSelector');
                                window.close();
                            }, 10000);
                            break;
                        default:
                            movieSelector.actionsTaken.push('Phase not set. ' + new Date());
                            me.saveMovieSelector(movieSelector);
                    }
                }/* else {
                    me.setMovieSelector();
                    location.reload();
                }*/
            }else if(HREF.includes(PAYMENT_URL)) {
                const HREF = location.href;
                if(HREF.includes('pagos.azul.com.do/paymentpage/MakePayment')) {
                    me.setMovieSelector('makePayment');
                    me.makePayment();
                }else if(HREF.includes('pagos.azul.com.do/paymentpage/ConfirmPayment')) {
                    me.setMovieSelector('confirmPayment');
                    me.confirmPayment();
                }
            }
        },
        selectDate: function(day = '25', month = 'Abril') {
            console.info('Searching date.');
            const me = this;
            if(!me.isLoggedIn()) me.logIn();
            const dateBar = $('.dates-bar');
            let dateFound = false;
            if(dateBar) {
                dateBar.children().each((index, elem) => {
                    let elemChildren = $(elem).children();
                    let dayElem = elemChildren.eq(0).text();
                    let monthElem = elemChildren.eq(1).text();
                    if((day === dayElem || day === '26') && month.toUpperCase() === monthElem.toUpperCase()) {
                        dateFound = true;
                        elem.click();
                        me.setPhase('findMovie');
                        setTimeout(function() {
                            me.findMovie();
                        }, 3000);
                        return false;
                    }
                });
            }
            if(!dateFound) {
                setTimeout(() => {
                    location.assign(me.DOWNTOWN_URL);
                }, me.REFRESH_TIME);
            }
        },
        findMovie: function(AMOUNT = 4) {
            const me = this;
            if(!me.isLoggedIn()) me.logIn();
            let horariosContainer = $('#horarios');
            if(horariosContainer) {
                horariosContainer.children().each((index, movieElem) => {
                    let typeContainer = $(movieElem).find('.type');
                    let imgTypeArr = [];
                    const VIP = 'VIP';
                    const CXC = 'CXC';
                    const TOKEN1 = 'AVENGER';
                    const TOKEN2 = 'END';
                    const TOKEN3 = 'GAME';
                    const TOKENTest1 = 'MARVEL';
                    const TOKENTest2 = 'CAPTAIN';
                    typeContainer.children().each((i, elem) => {
                        if(elem.nodeName === 'IMG') {
                            if(elem.src.toUpperCase().indexOf(VIP) > -1) imgTypeArr.push(VIP);
                            if(elem.src.toUpperCase().indexOf(CXC) > -1) imgTypeArr.push(CXC);
                        }
                    });
                    if(imgTypeArr.includes(VIP) && imgTypeArr.includes(CXC)) {
                        let title = $(movieElem).find('h3').text().trim();
                        if(title && title.toUpperCase().includes(TOKEN1) || (title.toUpperCase().includes(TOKEN2) && title.toUpperCase().includes(TOKEN3))) {
                            let allTimes = $(movieElem).find('ul').children();
                            let lastTime = allTimes[allTimes.length - 1];
                            let time = $(lastTime).text();
                            let timeButton = $(lastTime).find('a')[0];
                            if(timeButton) {
                                timeButton.click();
                                setTimeout(function() {
                                    let comboBox = $(movieElem).find('.form-control')[0];
                                    if(comboBox) {
                                        $(comboBox).val(AMOUNT);
                                        if ("createEvent" in document) {
                                            var evt = document.createEvent("HTMLEvents");
                                            evt.initEvent("change", false, true);
                                            comboBox.dispatchEvent(evt);
                                        } else {
                                            comboBox.fireEvent("onchange");
                                        }
                                        setTimeout(function() {
                                            let buyButton = $(movieElem).find('#compre')[0];
                                            if(buyButton) {
                                                buyButton.click();
                                                setTimeout(function() {
                                                    let confirmButton = $('.sa-confirm-button-container .confirm');
                                                    me.setPhase('selectSeats');
                                                    confirmButton.click();
                                                }, 2000);
                                            }
                                        }, 1000);
                                    }
                                }, 2000);
                                return false;
                            }
                        }
                    }
                }); 
            }
        },
        selectSeats: function(numberOfSeats = 4) {
            const me = this;
            const HREF = location.href;
            const URL = 'caribbeanpay.com/seats';
            if (HREF.includes(URL)) {
                const seatsContainer = $('.sits__row');
                const seatsContainerArr = seatsContainer.children();
                let selectedSeatsArr = [];
                let counter = 0;
                let foundSeats = false;
                let newSeatsArr = [];
                seatsContainerArr.each((i, seat) => {
                    if(seat.className.indexOf('sits__space') === -1) {
                        newSeatsArr.push(seat);
                    }
                });
                const mSeatArr = [];
                const nSeatArr = [];
                let nCount = 0;
                let mCount = 0;
                newSeatsArr.forEach(elem => {
                    if(elem.innerText.trim() === 'N') {
                        nCount++;
                    }
                    if(elem.innerText.trim() === 'M') {
                        mCount++;
                    }
                    if(nCount === 1) {
                        nSeatArr.push(elem);
                    }
                    if(mCount === 1) {
                        mSeatArr.push(elem);
                    }
                });
                let midN = Math.round(nSeatArr.length / 2 + 2);
                let midM = Math.round(mSeatArr.length / 2 + 2);
                let selectTheSeats = function(arr, len) {
                    for (let i = len; i > 0; i--) {
                        let seat = arr[i];
                        if (seat.className.indexOf('btn-success') > -1 && seat.getAttribute('disabled') === null) {
                                selectedSeatsArr.push(seat);
                                counter++;
                                if (counter === numberOfSeats) {
                                    selectedSeatsArr.forEach(selectedSeat => {
                                        selectedSeat.click();
                                    });
                                    foundSeats = true;
                                }
                        } else {
                            counter = 0;
                            if(selectedSeatsArr.length !== 0) selectedSeatsArr = [];
                        }
                        if (foundSeats) break;
                    }
                }
                selectTheSeats(nSeatArr, midN);
                if(!foundSeats) {
                    selectedSeatsArr = [];
                    selectTheSeats(mSeatArr, midM);
                }
                if(!foundSeats) {
                    selectedSeatsArr = [];
                    selectTheSeats(newSeatsArr, newSeatsArr.length - 1);
                }
                if (foundSeats) {
                    setTimeout(function () {
                        let confirmButton = $('.sa-confirm-button-container .confirm')[0];
                        if ("createEvent" in document) {
                            var evt = document.createEvent("HTMLEvents");
                            evt.initEvent("click", false, true);
                            confirmButton.dispatchEvent(evt);
                        } else {
                            confirmButton.fireEvent("click");
                        }
                        me.setPhase('selectPaymentMethod');
                    }, 2000);
                }
            }else{
                me.setPhase('selectDate');
                location.assign(me.DOWNTOWN_URL);
            }
        },
        selectPaymentMethod: function() {
            const me = this;
            if(location.href.includes('caribbeanpay.com/checkout')) {
                $('img').each((i, elem) => {
                    let parent = elem.parentElement;
                    if(parent.nodeName === 'A') {
                        if(parent.href.includes('azul')) {
                            me.setPhase('makePayment');
                            setTimeout(function() {
                                parent.click();
                            }, 1000);
                        }
                    }
                });
            }else{
                me.setPhase('selectDate');
                me.checkUrl();
            }
        },
        makePayment: function() {
            const me = this;
            const HREF = location.href;
            if(HREF.includes('pagos.azul.com.do/paymentpage/MakePayment')) {
                let correctPurchaseObj = me.checkPurchaseInfo();
                if(correctPurchaseObj.place === 'Caribbean Cinemas' && correctPurchaseObj.amount === me.PAY_AMOUNT) {
                    let movieSelector = me.getMovieSelector();
                    movieSelector.actionsTaken.push('Proper place selected and proper amount. ' + new Date());
                    me.saveMovieSelector(movieSelector);
                    $('#CreditCard').val('0123456789012345');
                    $('#ExpirationMonth').val('00');
                    $('#ExpirationYear').val('00');
                    $('#SecurityCode').val('000');
                    me.setPhase('confirmPayment');
                    $('#SubmitButton').click();
                }
            }else{
                let movieSelector = me.getMovieSelector();
                movieSelector.actionsTaken.push('In makePayment else ' + new Date());
                me.saveMovieSelector(movieSelector);
            }
        },
        confirmPayment: function() {
            const me = this;
            const HREF = location.href;
            let paymentCommited = false;
            const CONFIRM_PAYMENT_URL = 'pagos.azul.com.do/paymentpage/ConfirmPayment';
            if(HREF.includes(CONFIRM_PAYMENT_URL)) {
                let correctPurchaseObj = me.checkPurchaseInfo();
                if(correctPurchaseObj.place === 'Caribbean Cinemas' && correctPurchaseObj.amount === me.PAY_AMOUNT) {
                    paymentCommited = true;
                    me.setPhase('paymentConfirmed');
                    $('#SubmitButton').click();
                }
            }else{
                let movieSelector = me.getMovieSelector();
                movieSelector.actionsTaken.push('In makePayment else ' + new Date());
                me.saveMovieSelector(movieSelector);
            }
        },
        checkPurchaseInfo: function() {
            const me = this;
            let correctPurchaseObj = {
                place: '',
                amount: '',
            };
            $('#left2 table tbody').children().each((i, elem) => {
                let elemChildren = $(elem).children();
                let text1 = elemChildren.eq(0).text().trim();
                let text2 = elemChildren.eq(1).text().trim();
                if(text1.includes('Pagar a')) {
                    if(text2.includes('Caribbean Cinemas')) {
                        correctPurchaseObj.place = 'Caribbean Cinemas';
                    }
                }else if(text1.includes('Monto Total Compra')) {
                    if(text2.includes(me.PAY_AMOUNT)) {
                        correctPurchaseObj.amount = me.PAY_AMOUNT;
                    }
                }
            });
            return correctPurchaseObj;
        },
        isLoggedIn: function() {
            const me = this;
            me.checkUrl();
            const welcomeMessage = $('nav').find('h5').text();
            if(welcomeMessage.trim().toUpperCase().includes('JEREMY THEN')) {
                return true;
            }
            return false;
        },
        logIn: function() {
            const me = this;
            $('nav').find('ul').children().each((i, elem) => {
                let text = elem.innerText;
                if (text === 'Iniciar sesión') {
                    $(elem).find('a').click();
                    setTimeout(function () {
                        const emailField = $('#myLogin #email');
                        const passwordField = $('#myLogin #password');
                        const submitButton = $('#myLogin button.btn-submit');
                        emailField.val('email@gmail.com');
                        passwordField.val('pass');
                        setTimeout(function () {
                            submitButton.click();
                        }, 1000);
                    }, 1000);
                }
            });  
        },
        checkUrl: function() {
            const me = this;
            const HREF = location.href;
            const URL = me.DOWNTOWN_URL;
            if(HREF !== URL) {
                location.assign(URL);
            }
        },
        getMovieSelector: function() {
            const me = this;
            let movieSelector = localStorage.CCMovieSelector;
            if(movieSelector) {
                movieSelector = JSON.parse(movieSelector);
            }
            return movieSelector? movieSelector: null;
        },
        setMovieSelector: function(phase = 'selectDate') {
            const me = this;
            const movieSelector = {
                phase: phase,
                date: {
                    day: me.day,
                    month: me.month
                },
                status: 'working',
                actionsTaken: []
            };
            localStorage.CCMovieSelector = JSON.stringify(movieSelector);
        },
        saveMovieSelector: function(movieSelector) {
            localStorage.CCMovieSelector = JSON.stringify(movieSelector);
        },
        setPhase: function(phase) {
            const me = this;
            let movieSelector = me.getMovieSelector();
            movieSelector.phase = phase;
            me.saveMovieSelector(movieSelector);
        }
    };
    

setTimeout(() => {
    CCMovieSelector.handleCCMovieSelector();
}, 5000);

/*movieSelector = {
    phase: 'selectDate',
    date: {
        day: '25',
        month: 'Abril'
    },
    status: 'working',
    actionsTaken: []
};
localStorage.CCMovieSelector = JSON.stringify(movieSelector);*/