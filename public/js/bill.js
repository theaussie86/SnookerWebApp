$(function(){

    $.ajax({
        type: 'GET',
        url: '/bills/get',
        success: function(bills){
            $.each(bills,function(i,bill){
                moment.locale('de');
                var monyear = moment(bill.billDate).format('MMM YYYY');
                var salesClass = '';
                var feeClass = '';

                if(bill.salesPaid && bill.feePaid){
                    rowClass='table-success';
                } else if(bill.feePaid){
                    feeClass='table-success';
                } else if(bill.salesPaid){
                    salesClass = 'table-success';
                }

                $('#navbarNavAltMarkup').removeClass('show');
                $('#myBills').append('<tr class="'+rowClass+'" data-toggle="modal" data-target="#billModal"><td>'+monyear+'</td><td class="'+salesClass+'">'+bill.visitorsSales.toFixed(2).replace('.',',')+' €'+'</td><td class="'+feeClass+'">'+bill.membershipFee.toFixed(2).replace('.',',')+' €'+'</td></tr>');
            });
        }
    });
    var username = $('#username').text().split(' ');

    $('#myBills').on('click','tr',function(e){
        var $row = $(this);
        var $tds = $row.find('td');
        var datum = $tds[0].textContent.split(' ');
        var monat = moment().month(datum[0]).format('M');
        var Jahr = Number(datum[1]);
        datum = new Date(Jahr,monat-1,1,12).getTime();
        var gast = $tds[1].textContent.trim();
        var beitrag = $tds[2].textContent.trim();
        // console.log(datum+', '+gast+', '+beitrag);
        $('#billModalLabel').text('Rechnung '+$tds[0].textContent);
        $('#lblBeitrag').text('Beitrag '+$tds[0].textContent+':');
        $('#beitrag').text(beitrag);
        $('#tblumsatz').empty();        
        $.ajax({
            type: 'GET',
            url: '/bills/single/'+datum,
            success: function(rents){
                var output= rents.map((rent)=>{
                    var onlyguest=1;
                    if (rent.onlyGuests){
                        onlyguest = 2;
                    }
                    var pl;
                    if (rent.onlyGuests) {
                        pl= rent.player1+' und '+rent.player2;
                    } else if(rent.player1 === username[1]){
                        pl= rent.player2;
                    } else {
                        pl= rent.player1;
                    }
                    return {
                        d:moment(rent.datum).format('DD.MM.YYYY'), 
                        p1:pl, 
                        t: moment(rent.ende).diff(rent.start)/3600000,
                        p: Math.ceil(moment(rent.ende).diff(rent.start)*3.5/360000)*onlyguest/10
                    };
                }).sort(function(a, b) {
                    return parseFloat(b.d) - parseFloat(a.d);
                });
                console.log(output.length);

                if (output.length === 0){
                    $('#umsatz').empty();
                    $('#lblsumme').empty();      
                    $('#summe').empty();                                        
                    $('#umsatz').text('Du hast letzten Monat nicht mit Gästen gespielt.'); 
                }else{
                    $('#umsatz').empty();
                    $('#umsatz').append('Umsatz Gastspieler Vormonat:<table id="tblumsatz" class="table"></table>');                    
                    $.each(output,function(i, x){
                        $('#tblumsatz').append('<tr><td>'+x.d+'</td><td>'+x.p1+'</td><td>'+x.t.toFixed(1).replace('.',',')+' h'+'</td><td>'+x.p.toFixed(2).replace('.',',')+' €'+'</td></tr>');                    
                    });
                    $('#summe').text(gast); 
                }

            }
        });

    });

});