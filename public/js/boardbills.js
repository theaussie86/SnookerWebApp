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
        datum = new Date(Date.UTC(Jahr,monat,0,12)).getTime();
        var gast = $tds[2].textContent.trim();
        var beitrag = $tds[3].textContent.trim();
        var username = $tds[1].textContent.trim();
        $('#billModalLabel').text('Rechnung '+$tds[0].textContent+' von '+username);
        $('#lblBeitrag').text('Beitrag '+moment().month(monat).format('MMMM')+':');
        $('#beitrag').text(beitrag);
        $('#lblvisitors').text('Gastumsatz '+moment().month(monat-1).format('MMMM')+':');
        $('#visitors').text(gast);
        $('#editBill').prop('disabled',true);
        $('#tblumsatz').empty();        
        $.ajax({
            type: 'GET',
            url: '/board/singlebill',
            data:{
                username: username,
                datum: datum
            },
            success: function(data){
                if (data[0].salesPaid) $('#salesPaid').prop('checked', true);
                if (data[0].feePaid) $('#feePaid').prop('checked', true);
            }
        });

    });

    $('#editBill').on('click',function(){
        var salesPaid = $('#salesPaid').prop('checked');
        var feePaid = $('#feePaid').prop('checked');
        var header = $('#billModalLabel').text().split(' ');
        var username = header[4];
        var monat = moment().month(header[1]).format('M');
        var jahr = Number(header[2]);
        var billDate= new Date(Date.UTC(jahr,monat,0,12)).getTime();
        $.ajax({
            method: 'GET',
            url: '/board/editbill',
            data:{
                username: username,
                datum: billDate,
                salesPaid: salesPaid,
                feePaid: feePaid
            },
            success: function(data){
                $('.alert-success').remove();
                $('#filter').after('<div class="alert small alert-success alert-dismissable "><a href="#" class="close" data-dismiss="alert" aria-label="close" title="close">×</a>'+
                data.success_msg+'</div>');
            }
        });
    });

    $('#salesPaid').on('change',function(){
        enable();
    });

    $('#feePaid').on('change',function(){
        enable();
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

    var enable = function(){
        $('#editBill').prop('disabled',false);
    };

    var filter = function(){
        var monat= $('#cbomonth').val();
        var jahr= $('#cboyear').val();
        var member= $('#cbomembers').val();

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