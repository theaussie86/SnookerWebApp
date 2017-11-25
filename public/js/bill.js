$(function(){
    moment.locale('de');

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
            url: '/members/bills/single/'+datum,
            success: function(rents){
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

    $('#downloadBill').on('click',function(){
        // Umsätze und Beitrag ermitteln 
        var $sales = Number($('#summe').text().substring(0,$('#summe').text().indexOf(' ')).replace(',','.'))||0;
        var $beitrag = Number($('#beitrag').text().substring(0,$('#beitrag').text().indexOf(' ')).replace(',','.'));
        var gesamt = ($sales+$beitrag).toFixed(2).replace('.',',')+' €';
        $sales = $('#summe').text() || '0,00 €';
        $beitrag = $('#beitrag').text();
        var $rents;
        if($('#umsatz').find('tr').length>0){
            $rents = $('#umsatz').find('tr').get().map((tr)=>{
                var row = {
                    datum: tr.cells[0].textContent,
                    spieler: tr.cells[1].textContent,
                    zeit: tr.cells[2].textContent,
                    betrag: tr.cells[3].textContent,                    
                }
                
                return row;
            });
            var datums= $rents.map(function(x) {
                return x.datum;
            }).join('\n');
            var gaeste= $rents.map(function(x) {
                return x.spieler;
            }).join('\n');
            var zeiten= $rents.map(function(x) {
                return x.zeit;
            }).join('\n');
            var betraege= $rents.map(function(x) {
                return x.betrag;
            }).join('\n');
        } else {
            $rents = 'Keine Gastumsätze...'
        }

        // Rechnungsdetails ermitteln
        var tempDate = $('#billModalLabel').text().split(' ');
        var time= tempDate[1]+' '+tempDate[2];
        var monat = moment().month(tempDate[1]).format('MM');
        var jahr = Number(tempDate[2]);
        var dueDate = moment(new Date(jahr,monat,0)).format('DD.MM.YYYY');
        $.ajax({
            type: 'GET',
            url: '/members/bills/getUser',
            success: function(user){
                var billnumber = jahr+'-'+monat+'-'+user.mitID; 
                var doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
                // images, shapes
                var imgData='data:image/jpeg;base64,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';
                var x1=20;
                var y1=100;
                var w=175;
                var h=90;
                var hh= 6;

                doc.addImage(imgData,'JPEG',135,29,60,20);                               
                doc.rect(x1,y1,w,h);
                doc.setFillColor(147,190,210);
                doc.rect(x1,y1-hh,w,hh,'FD');
                doc.setFillColor('0.80');                                
                doc.rect(105,70,90,20,'F');
                doc.line(x1+30,y1-hh,x1+30,y1+h);
                doc.line(x1+w-30,y1-hh,x1+w-30,y1+h);
                doc.line(x1+w-60,y1-hh,x1+w-60,y1+h);
                doc.line(x1,255,x1+w,255); 
                
                // Text 
                doc.setFont('Calibri');
                    // Normal
                    doc.setFontSize(14);
                    doc.text(x1,75,user.firstname+' '+user.lastname+'\n'+user.street+'\n'+user.zip+' '+user.city);
                    doc.text(110,75,'Rechnungsnummer:\nAbrechnungszeitraum:\nFälligkeitsdatum:');
                    doc.text(160,75,billnumber+'\n'+time+'\n'+dueDate);
                    doc.text(x1,270,'IBAN:\nBIC:\nBank:');
                    doc.text(35,270,'DE20150400680686090200\nCOBADEFFXXX\nCommerzbank');
                    doc.text(x1+1,y1-1,'Datum');
                    doc.text(x1+31,y1-1,'Gastspieler');
                    doc.text(x1+w-59,y1-1,'Spielzeit [h]');
                    doc.text(x1+w-29,y1-1,'Betrag [€]');
                    doc.text(x1+1,y1+6,datums||'');
                    doc.text(x1+31,y1+6,gaeste||'');
                    doc.text(x1+w-59,y1+6,zeiten||'');
                    doc.text(x1+w-29,y1+6,betraege||'');                    
                    
                    doc.setFontSize(11);
                    doc.text(x1+19,253,'Bitte überweisen Sie den Rechnungsbetrag bis zum '+dueDate+' auf unten stehendes Konto.');
                    

                    // Fett
                    doc.setFontStyle('bold');
                    doc.setFontSize(24);
                    doc.text(x1,35,'Snookerclub Neubrandenburg');
                    doc.text(x1+w-96,230,'Rechnungsbetrag: '+gesamt);
                    doc.setFontSize(14);
                    doc.text(x1,68,'Mitglied');
                    doc.text(x1,263,'Bankverbindung');
                    doc.setFontSize(18);
                    doc.text(x1+w-52,200,'Summe: '+$sales);
                    doc.text(x1+w-66,210,'Beitrag '+moment().month(tempDate[1]).format('MMM')+': '+$beitrag);
                    

                    // Kursiv
                    doc.setFontStyle('italic');
                    doc.setFontSize(14);
                    doc.text(x1,42,'Nonnenhofer Straße 60, 17033 Neubrandenburg\nsnookertempel@gmail.com')
                    doc.setFontSize
        
                doc.save(billnumber+'.pdf');
            }        
        });


    });

});