var CCMovieSelector = {
        day: '25',
        month: 'Abril',
        AMOUNT: 4,
        PAY_AMOUNT: '2,680.00',
        DOWNTOWN_URL: "https://caribbeanpay.com/theaters/downtowncenter/",
        REFRESH_TIME: 10000,
        getPhases: ['selectDate', 'findMovie', 'selectSeats', 'selectPaymentMethod', 'makePayment', 'confirmPayment', 'paymentConfirmed'],
        start() {
            this.setMovieSelector('selectDate');
            location.assign(this.DOWNTOWN_URL);
        },
        stop() {
            localStorage.removeItem('CCMovieSelector');
        },
        handleCCMovieSelector() {
            const MAIN_URL = 'caribbeanpay.com';
            const PAYMENT_URL = 'pagos.azul.com.do/paymentpage';
            const HREF = location.href;
            if(HREF.includes(MAIN_URL)) {
                let movieSelector = this.getMovieSelector();
                if (movieSelector) {
                    let phase = movieSelector.phase;
                    switch(phase) {
                        case 'selectDate':
                            this.selectDate(this.day, this.month);
                            movieSelector.actionsTaken.push('Date selected. ' + new Date());
                            this.saveMovieSelector(movieSelector);
                            break;
                        case 'findMovie':
                            this.selectDate(this.day, this.month);
                            break;
                        case 'selectSeats':
                            this.selectSeats(this.AMOUNT);
                            break;
                        case 'selectPaymentMethod':
                            this.selectPaymentMethod();
                            break;
                        case 'paymentConfirmed':
                            movieSelector.actionsTaken.push('Payment Confirmed. ' + new Date());
                            this.saveMovieSelector(movieSelector);
                            setTimeout(() => {
                                window.close();
                            }, 10000);
                            break;
                        default:
                            movieSelector.actionsTaken.push('Phase not set. ' + new Date());
                            this.saveMovieSelector(movieSelector);
                    }
                }
            }else if(HREF.includes(PAYMENT_URL)) {
                const HREF = location.href;

                const isInMakePaymentPage = HREF.includes('pagos.azul.com.do/paymentpage/MakePayment');
                const isInConfirmPaymentPage = HREF.includes('pagos.azul.com.do/paymentpage/ConfirmPayment');

                if(isInMakePaymentPage) {
                    this.setMovieSelector('makePayment');
                    this.makePayment();
                }else if(isInConfirmPaymentPage) {
                    this.setMovieSelector('confirmPayment');
                    this.confirmPayment();
                }
            }
        },
        selectDate(day = '25', month = 'Abril') {
            console.info('Searching date.');
            if(!this.isLoggedIn()) {
                this.logIn();
            }
            const dateBar = $('.dates-bar');
            let dateFound = false;
            if(dateBar) {
                dateBar.children().each((index, elem) => {
                    let elemChildren = $(elem).children();
                    let dayElem = elemChildren.eq(0).text();
                    let monthElem = elemChildren.eq(1).text();
                    const foundDesiredDate = (day === dayElem || day === '26') && month.toUpperCase() === monthElem.toUpperCase();
                    if(foundDesiredDate) {
                        dateFound = true;
                        elem.click();
                        this.setPhase('findMovie');
                        setTimeout(() => this.findMovie(), 3000);
                        return false;
                    }
                });
            }
            if(!dateFound) {
                setTimeout(() => {
                    location.assign(this.DOWNTOWN_URL);
                }, this.REFRESH_TIME);
            }
        },
        findMovie(AMOUNT = 4) {
            if(!this.isLoggedIn()) {
                this.logIn();
            }
            let horariosContainer = $('#horarios');
            if(horariosContainer) {
                horariosContainer.children().each((index, movieElem) => {
                    let typeContainer = $(movieElem).find('.type');
                    const VIP = 'VIP';
                    const CXC = 'CXC';
                    const TOKEN1 = 'AVENGER';
                    const TOKEN2 = 'END';
                    const TOKEN3 = 'GAME';

                    let vipCxcType = {
                        hasVipType: false,
                        hasCxcType: false
                    };

                    typeContainer.children().each((i, elem) => {
                        let isImgNode = elem.nodeName === 'IMG';
                        if(isImgNode) {
                            const imgSrc = elem.src.toUpperCase();
                            if(imgSrc.includes(VIP)) {
                                vipCxcType.hasVipType = true;
                            }
                            if(imgSrc.includes(CXC)) {
                                vipCxcType.hasCxcType = true;
                            }
                        }
                    });
                    if(vipCxcType.hasVipType && vipCxcType.hasCxcType) {
                        let title = $(movieElem).find('h3').text().trim().toUpperCase();

                        const isDesiredMovie = title && title.includes(TOKEN1) || (title.includes(TOKEN2) && title.includes(TOKEN3));
                        
                        if(isDesiredMovie) {
                            let allTimes = $(movieElem).find('ul').children();
                            let lastTime = allTimes[allTimes.length - 1];
                            let time = $(lastTime).text();
                            let timeButton = $(lastTime).find('a')[0];
                            if(timeButton) {
                                timeButton.click();

                                let comboBox = $(movieElem).find('.form-control')[0];

                                    const setAmountOfSeats = () => {
                                        $(comboBox).val(AMOUNT);
                                        if ("createEvent" in document) {
                                            var evt = document.createEvent("HTMLEvents");
                                            evt.initEvent("change", false, true);
                                            comboBox.dispatchEvent(evt);
                                        } else {
                                            comboBox.fireEvent("onchange");
                                        }
                                    }

                                    const clickBuyButtonAndConfirmOrder = () => {
                                        let buyButton = $(movieElem).find('#compre')[0];
                                        if(buyButton) {
                                            buyButton.click();
                                            setTimeout(() => {
                                                let confirmButton = $('.sa-confirm-button-container .confirm');
                                                this.setPhase('selectSeats');
                                                confirmButton.click();
                                            }, 2000);
                                        }
                                    }

                                setTimeout(() => {
                                    if(comboBox) {
                                        setAmountOfSeats();
                                        setTimeout(() => {
                                            clickBuyButtonAndConfirmOrder();
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
        selectSeats(numberOfSeats = 4) {
            const HREF = location.href;
            const URL = 'caribbeanpay.com/seats';
            const isInSelectSeatsPage = HREF.includes(URL);
            if (isInSelectSeatsPage) {
                const seatsContainer = $('.sits__row');
                const seatsContainer = seatsContainer.children();
                let selectedSeatsArr = [];
                let counter = 0;
                let foundSeats = false;
                let newSeatsArr = [];
                seatsContainer.each((i, seat) => {
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
                let selectTheSeats = (arr, len) => {
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
                    setTimeout(() => {
                        let confirmButton = $('.sa-confirm-button-container .confirm')[0];
                        if ("createEvent" in document) {
                            var evt = document.createEvent("HTMLEvents");
                            evt.initEvent("click", false, true);
                            confirmButton.dispatchEvent(evt);
                        } else {
                            confirmButton.fireEvent("click");
                        }
                        this.setPhase('selectPaymentMethod');
                    }, 2000);
                }
            }else{
                this.setPhase('selectDate');
                location.assign(this.DOWNTOWN_URL);
            }
        },
        selectPaymentMethod() {
            const isInCheckoutPage = location.href.includes('caribbeanpay.com/checkout');
            if(isInCheckoutPage) {
                $('img').each((i, elem) => {
                    let parent = elem.parentElement;
                    if(parent.nodeName === 'A') {
                        if(parent.href.includes('azul')) {
                            this.setPhase('makePayment');
                            setTimeout(() => {
                                parent.click();
                            }, 1000);
                        }
                    }
                });
            }else{
                this.setPhase('selectDate');
                this.checkUrl();
            }
        },
        makePayment() {
            const HREF = location.href;
            if(HREF.includes('pagos.azul.com.do/paymentpage/MakePayment')) {
                let correctPurchaseObj = this.checkPurchaseInfo();
                if(correctPurchaseObj.place === 'Caribbean Cinemas' && correctPurchaseObj.amount === this.PAY_AMOUNT) {
                    let movieSelector = this.getMovieSelector();
                    movieSelector.actionsTaken.push('Proper place selected and proper amount. ' + new Date());
                    this.saveMovieSelector(movieSelector);
                    $('#CreditCard').val('0123456789012345');
                    $('#ExpirationMonth').val('00');
                    $('#ExpirationYear').val('00');
                    $('#SecurityCode').val('000');
                    this.setPhase('confirmPayment');
                    $('#SubmitButton').click();
                }
            }else{
                let movieSelector = this.getMovieSelector();
                movieSelector.actionsTaken.push('In makePayment else ' + new Date());
                this.saveMovieSelector(movieSelector);
            }
        },
        confirmPayment() {
            const HREF = location.href;
            let paymentCommited = false;
            const CONFIRM_PAYMENT_URL = 'pagos.azul.com.do/paymentpage/ConfirmPayment';
            if(HREF.includes(CONFIRM_PAYMENT_URL)) {
                let correctPurchaseObj = this.checkPurchaseInfo();
                if(correctPurchaseObj.place === 'Caribbean Cinemas' && correctPurchaseObj.amount === this.PAY_AMOUNT) {
                    paymentCommited = true;
                    this.setPhase('paymentConfirmed');
                    $('#SubmitButton').click();
                }
            }else{
                let movieSelector = this.getMovieSelector();
                movieSelector.actionsTaken.push('In makePayment else ' + new Date());
                this.saveMovieSelector(movieSelector);
            }
        },
        checkPurchaseInfo() {
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
                    if(text2.includes(this.PAY_AMOUNT)) {
                        correctPurchaseObj.amount = this.PAY_AMOUNT;
                    }
                }
            });
            return correctPurchaseObj;
        },
        isLoggedIn() {
            this.checkUrl();
            const welcomeMessage = $('nav').find('h5').text();
            if(welcomeMessage.trim().toUpperCase().includes('JEREMY THEN')) {
                return true;
            }
            return false;
        },
        logIn() {
            $('nav').find('ul').children().each((i, elem) => {
                let text = elem.innerText;
                if (text === 'Iniciar sesión') {
                    $(elem).find('a').click();
                    setTimeout(() => {
                        const emailField = $('#myLogin #email');
                        const passwordField = $('#myLogin #password');
                        const submitButton = $('#myLogin button.btn-submit');
                        emailField.val('email@gmail.com');
                        passwordField.val('pass');
                        setTimeout(() => {
                            submitButton.click();
                        }, 1000);
                    }, 1000);
                }
            });  
        },
        checkUrl() {
            const HREF = location.href;
            const URL = this.DOWNTOWN_URL;
            if(HREF !== URL) {
                location.assign(URL);
            }
        },
        getMovieSelector() {
            let movieSelector = localStorage.CCMovieSelector;
            if(movieSelector) {
                movieSelector = JSON.parse(movieSelector);
            }
            return movieSelector? movieSelector: null;
        },
        setMovieSelector(phase = 'selectDate') {
            const movieSelector = {
                phase: phase,
                date: {
                    day: this.day,
                    month: this.month
                },
                status: 'working',
                actionsTaken: []
            };
            localStorage.CCMovieSelector = JSON.stringify(movieSelector);
        },
        saveMovieSelector(movieSelector) {
            localStorage.CCMovieSelector = JSON.stringify(movieSelector);
        },
        setPhase(phase) {
            let movieSelector = this.getMovieSelector();
            movieSelector.phase = phase;
            this.saveMovieSelector(movieSelector);
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