$(function(){
    
    $.ajax({
        type: 'GET',
        url: '/bills/get',
        success: function(bills){
            console.log(bills);
            $.each(bills,function(i,bill){
                var monyear = moment(bill.billDate).format('MMM YYYY');
                $('#navbarNavAltMarkup').removeClass('show');
                $('#myBills').append('<tr><td>'+monyear+'</td><td class="sales">'+bill.visitorsSales.toFixed(2).replace('.',',')+' €'+'</td><td class="fees">'+bill.membershipFee.toFixed(2).replace('.',',')+' €'+'</td></tr>');
            });
        }
    });
});