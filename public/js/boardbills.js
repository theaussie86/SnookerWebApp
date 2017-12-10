$(function(){

    moment.locale('de');

    var cboyear = 2014;
    while (cboyear<=new Date().getFullYear()) {
        $('#cboyear').append('<option value="'+cboyear+'">'+cboyear+'</option>')
        cboyear++;
    }

    $('#allBills').on('click','tr',function(e){
        var $row = $(this);
        var $tds = $row.find('td');
        var datum = $tds[0].textContent.split(' ');
        var monat = moment().month(datum[0]).format('M');
        var Jahr = Number(datum[1]);
        datum = new Date(Jahr,monat,1,12).getTime();
        var gast = $tds[2].textContent.trim();
        var beitrag = $tds[3].textContent.trim();
        var username = $tds[1].textContent.trim();
        // console.log(datum+', '+gast+', '+beitrag);
        $('#billModalLabel').text('Rechnung '+$tds[0].textContent);
        $('#lblBeitrag').text('Beitrag '+moment().month(monat).format('MMMM')+':');
        $('#beitrag').text(beitrag);
        $('#tblumsatz').empty();        
        $.ajax({
            type: 'GET',
            url: '/board/singlebill/',
            data:{
                username: username,
                datum: datum
            },
            success: function(bill){
                var output= rents.map((rent)=>{
                    var onlyguest=1;
                    var pl;
                    if (rent.onlyGuests) {
                        pl= rent.player1+' und '+rent.player2;
                        onlyguest = 2;
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

                if (output.length === 0){
                    $('#umsatz').empty();
                    $('#lblsumme').empty();      
                    $('#summe').empty();                                        
                    $('#umsatz').text('Du hast letzten Monat nicht mit Gästen gespielt.'); 
                }else{
                    $('#lblsumme').text('Summe:');
                    $('#umsatz').empty();
                    $('#umsatz').append('Umsatz Gäste Vormonat:<table id="tblumsatz" class="table"></table>');                    
                    $.each(output,function(i, x){
                        $('#tblumsatz').append('<tr><td>'+x.d+'</td><td>'+x.p1+'</td><td>'+x.t.toFixed(1).replace('.',',')+' h'+'</td><td>'+x.p.toFixed(2).replace('.',',')+' €'+'</td></tr>');                    
                    });
                    $('#summe').text(gast); 
                }

            }
        });

    });

    $('#cbomonth').on('change',function(){
        filter();
    });

    $('#cboyear').on('change',function(){
        filter();
    });

    $('#cbomembers').on('change',function(){
        filter();
    });

    var filter = function(){
        var monat= $('#cbomonth').val();
        var jahr= $('#cboyear').val();
        var member= $('#cbomembers').val();

        console.log(monat, jahr, member);
        $('#allBills').empty();
        if($('div.alert').length>0) $('div.alert').remove();
        
        $.ajax({
            type: 'GET',
            url: '/board/filterbills',
            data: {
               month: monat,
               year: jahr,
               member: member
            },
            success: function(data){
                var mtype = 'alert-danger';
                if (data.bills) mtype= 'alert-success';
                var message = data.message;
                var bills = data.bills;
                $('#board-caption').prepend('<div class="alert small '+mtype+' alert-dismissable "><a href="#" class="close" data-dismiss="alert" aria-label="close" title="close">×</a>'+
                message+'</div>');
                $.each(bills,function(i, bill){
                    $('#allBills').append('<tr data-toggle="modal" data-target="#billModal"><td>'+moment(bill.billDate).format('MMMM YYYY')+'</td><td>'+bill.username+'</td><td>'+bill.visitorsSales.toFixed(2).replace('.',',')+' €'+'</td><td>'+bill.membershipFee.toFixed(2).replace('.', ",")+' €'+'</td></tr>');
                });
            }
        });
    }
});